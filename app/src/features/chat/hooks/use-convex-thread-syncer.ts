"use client";

import { useThreadMessages } from "@convex-dev/agent/react";
import { usePaginatedQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@convex/_generated/api";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { logThreadLoad, logThreadUpdate, providerLogger } from "@/lib/logger";
import { useThreadContext } from "@/features/chat/components/thread-context";
import { convertConvexMessage, isValidThreadMessage, type ConvexMessage } from "../providers/types";
import type { AgentModel } from "@convex/ai/lib/agents";

interface UseConvexThreadSyncerProps {
    model: AgentModel;
    isRunning: boolean;
}

export const useConvexThreadSyncer = ({ model, isRunning }: UseConvexThreadSyncerProps) => {
    const { currentThreadId, setThreads } = useThreadContext();
    const [isSyncPaused, setSyncPaused] = useState(false);
    const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isRunning) {
            if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
            if (!isSyncPaused) {
                providerLogger.debug("[Syncer] Pausing sync due to running stream.");
                setSyncPaused(true);
            }
        } else if (isSyncPaused) {
            providerLogger.debug("[Syncer] Queueing sync resume after delay.");
            pauseTimeoutRef.current = setTimeout(() => {
                providerLogger.debug("[Syncer] Sync resumed.");
                setSyncPaused(false);
                pauseTimeoutRef.current = null;
            }, 2000);
        }

        return () => {
            if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        };
    }, [isRunning, isSyncPaused]);

    const paginatedMessagesArgs = useMemo(() => {
        return currentThreadId !== "default"
            ? {
                  threadId: currentThreadId,
                  model: model,
              }
            : "skip";
    }, [currentThreadId, model]);

    const { results: convexMessages, isLoading: messagesAreLoading } = useThreadMessages(api.chat.functions.listMessages, paginatedMessagesArgs, {
        initialNumItems: 50,
    });

    const { results: convexThreads } = usePaginatedQuery(api.chat.functions.getThreads, {}, { initialNumItems: 10 });

    const shouldUpdateMessages = useCallback((current: ThreadMessageLike[], newMessages: ThreadMessageLike[]) => {
        if (current.length !== newMessages.length) return true;
        if (current.length === 0) return false;

        for (const msg of newMessages) {
            if (!isValidThreadMessage(msg)) {
                console.warn("Invalid message detected in shouldUpdateMessages:", msg);
                return false;
            }
        }

        // Check all messages for basic integrity
        for (let i = 0; i < current.length; i++) {
            const currentMsg = current[i];
            const newMsg = newMessages[i];

            if (!currentMsg || !newMsg || currentMsg.id !== newMsg.id || currentMsg.role !== newMsg.role) return true;

            if (Array.isArray(currentMsg.content) && Array.isArray(newMsg.content)) {
                if (currentMsg.content.length !== newMsg.content.length) return true;

                const currentTextPart = currentMsg.content.find((c) => c.type === "text");
                const newTextPart = newMsg.content.find((c) => c.type === "text");

                if (currentTextPart?.type === "text" && newTextPart?.type === "text") {
                    if (currentTextPart.text !== newTextPart.text) return true;
                }
            }
        }

        return false;
    }, []);

    useEffect(() => {
        providerLogger.debug("[Syncer] Main useEffect triggered", {
            messagesAreLoading,
            hasConvexMessages: !!convexMessages,
            currentThreadId,
            isRunning,
            isSyncPaused,
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

            if (!isRunning) {
                setThreads((prev) => {
                    const current = prev.get(currentThreadId) || [];
                    providerLogger.debug("[Syncer] Checking for update", { currentCount: current.length, newCount: convertedMessages.length });

                    if (current.length > convertedMessages.length) {
                        providerLogger.debug("[Syncer] Skipping update: local state has optimistic messages (length check).");
                        return prev;
                    }

                    if (current.length !== convertedMessages.length || shouldUpdateMessages(current, convertedMessages)) {
                        logThreadUpdate(currentThreadId, convertedMessages.length);
                        providerLogger.debug("Updated to %d DB messages [isRunning: %s]", convertedMessages.length, isRunning);
                        return new Map(prev).set(currentThreadId, convertedMessages);
                    }

                    return prev;
                });
            } else {
                providerLogger.debug("Skipping DB update while streaming (isRunning: %s)", isRunning);
            }
        }
    }, [messagesAreLoading, convexMessages, currentThreadId, setThreads, shouldUpdateMessages, isRunning, isSyncPaused]);

    return { convexThreads, messagesAreLoading };
};
