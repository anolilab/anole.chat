"use client";

import type { AgentModel } from "@anole/convex/ai/lib/agents";
import { api } from "@anole/convex/api";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { useThreadMessages } from "@convex-dev/agent/react";
import { usePaginatedQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { logThreadLoad, logThreadUpdate, providerLogger } from "@/lib/logger";

import { 
    createThread, 
    updateThreadMetadata, 
    getAllThreads as getAllThreadsFromDB,
    type ThreadDocument 
} from "../collections/threads-collection";
import { 
    createMessage, 
    deleteMessagesByThreadId, 
    getMessagesByThreadId,
    convertToMessageDocument,
    convertToThreadMessageLike,
    type MessageDocument 
} from "../collections/messages-collection";
import { useThreads, useMessagesSorted } from "../collections/query-collection";

import type { ConvexMessage } from "../providers/types";
import { convertConvexMessage, isValidThreadMessage } from "../providers/types";

interface UseConvexThreadSyncerProperties {
    isRunning: boolean;
    model: AgentModel;
    currentThreadId: string;
}

export const useConvexThreadSyncer = ({ isRunning, model, currentThreadId }: UseConvexThreadSyncerProperties) => {
    const [isSyncPaused, setSyncPaused] = useState(false);
    const pauseTimeoutReference = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isRunning) {
            if (pauseTimeoutReference.current) {
                clearTimeout(pauseTimeoutReference.current);
            }

            if (!isSyncPaused) {
                providerLogger.debug("[Syncer] Pausing sync due to running stream.");
                setSyncPaused(true);
            }
        } else if (isSyncPaused) {
            providerLogger.debug("[Syncer] Queueing sync resume after delay.");
            pauseTimeoutReference.current = setTimeout(() => {
                providerLogger.debug("[Syncer] Sync resumed.");
                setSyncPaused(false);
                pauseTimeoutReference.current = null;
            }, 2000);
        }

        return () => {
            if (pauseTimeoutReference.current) {
                clearTimeout(pauseTimeoutReference.current);
            }
        };
    }, [isRunning, isSyncPaused]);

    const shouldSkip = currentThreadId === "default";

    const paginatedMessagesArguments = useMemo(
        () =>
            (shouldSkip
                ? "skip"
                : {
                    model,
                    threadId: currentThreadId,
                }),
        [currentThreadId, model, shouldSkip],
    );

    const { isLoading, results: convexMessages } = useThreadMessages(api.chat.functions.getThreadMessages, paginatedMessagesArguments, {
        initialNumItems: 50,
    });

    const messagesAreLoading = shouldSkip ? false : isLoading;

    const { results: convexThreads } = usePaginatedQuery(api.chat.functions.getThreads, {}, { initialNumItems: 10 });

    // Get local data using TanStack DB hooks
    const localThreads = useThreads();
    const localMessages = useMessagesSorted(currentThreadId);

    const shouldUpdateMessages = useCallback((current: ThreadMessageLike[], newMessages: ThreadMessageLike[]) => {
        if (current.length !== newMessages.length) {
            return true;
        }

        if (current.length === 0) {
            return false;
        }

        for (const message of newMessages) {
            if (!isValidThreadMessage(message)) {
                console.warn("Invalid message detected in shouldUpdateMessages:", message);
                return false;
            }
        }

        // Check all messages for basic integrity
        for (const [index, currentMessage] of current.entries()) {
            const newMessage = newMessages[index];

            if (!currentMessage || !newMessage || currentMessage.id !== newMessage.id || currentMessage.role !== newMessage.role)
                return true;

            if (Array.isArray(currentMessage.content) && Array.isArray(newMessage.content)) {
                if (currentMessage.content.length !== newMessage.content.length) {
                    return true;
                }

                const currentTextPart = currentMessage.content.find((c) => c.type === "text");
                const newTextPart = newMessage.content.find((c) => c.type === "text");

                if (currentTextPart?.type === "text" && newTextPart?.type === "text" && currentTextPart.text !== newTextPart.text) {
                    return true;
                }
            }
        }

        return false;
    }, []);

    // Sync threads from Convex to local DB
    useEffect(() => {
        if (!convexThreads || !localThreads) return;

        providerLogger.debug("[Syncer] Syncing threads from Convex to local DB", {
            convexThreadsCount: convexThreads.length,
            localThreadsCount: localThreads.length,
        });

        for (const convexThread of convexThreads) {
            const existingThread = localThreads.find(t => t.id === convexThread._id);
            
            if (!existingThread) {
                // Create new thread in local DB
                createThread(convexThread._id, {
                    createdAt: new Date(convexThread._creationTime),
                    lastActivity: new Date(convexThread._creationTime),
                    status: convexThread.status === "active" ? "active" : "archived",
                    title: convexThread.title || "Untitled Thread",
                    parentThreadId: convexThread.parentThreadIds?.[0],
                });
            } else {
                // Update existing thread metadata
                updateThreadMetadata(convexThread._id, {
                    status: convexThread.status === "active" ? "active" : "archived",
                    title: convexThread.title || existingThread.metadata.title,
                    parentThreadId: convexThread.parentThreadIds?.[0],
                });
            }
        }
    }, [convexThreads, localThreads]);

    // Sync messages from Convex to local DB
    useEffect(() => {
        providerLogger.debug("[Syncer] Main useEffect triggered", {
            currentThreadId,
            hasConvexMessages: !!convexMessages,
            isRunning,
            isSyncPaused,
            messagesAreLoading,
        });

        if (isSyncPaused) {
            providerLogger.debug("[Syncer] Sync is paused, skipping update.");
            return;
        }

        if (!messagesAreLoading && convexMessages && currentThreadId && currentThreadId !== "default") {
            const resultCount = convexMessages.length;
            logThreadLoad(currentThreadId, resultCount);

            const validMessages = convexMessages.filter((message) => message && message._id);
            providerLogger.debug("[Syncer] Raw convex messages", { count: convexMessages.length, messages: convexMessages });

            const convertedMessages = validMessages.map((message) => convertConvexMessage(message as unknown as ConvexMessage));
            providerLogger.debug("[Syncer] Converted messages", { count: convertedMessages.length, messages: convertedMessages });

            if (isRunning) {
                providerLogger.debug("Skipping DB update while streaming (isRunning: %s)", isRunning);
            } else {
                // Get current local messages
                const currentLocalMessages = localMessages || [];
                
                providerLogger.debug("[Syncer] Checking for update", { 
                    currentCount: currentLocalMessages.length, 
                    newCount: convertedMessages.length 
                });

                if (currentLocalMessages.length > convertedMessages.length) {
                    providerLogger.debug("[Syncer] Skipping update: local state has optimistic messages (length check).");
                    return;
                }

                if (currentLocalMessages.length !== convertedMessages.length || shouldUpdateMessages(currentLocalMessages, convertedMessages)) {
                    logThreadUpdate(currentThreadId, convertedMessages.length);
                    providerLogger.debug("Updated to %d DB messages [isRunning: %s]", convertedMessages.length, isRunning);

                    // Clear existing messages for this thread
                    deleteMessagesByThreadId(currentThreadId);

                    // Add new messages to local DB
                    convertedMessages.forEach(message => {
                        const messageDoc = convertToMessageDocument(message, currentThreadId);
                        createMessage(messageDoc);
                    });
                }
            }
        }
    }, [messagesAreLoading, convexMessages, currentThreadId, shouldUpdateMessages, isRunning, isSyncPaused, localMessages]);

    return { convexThreads, messagesAreLoading };
};