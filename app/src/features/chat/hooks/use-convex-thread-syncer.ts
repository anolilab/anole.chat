"use client";

import type { AgentModel } from "@anole/convex/ai/lib/agents";
import { api } from "@anole/convex/api";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { useThreadMessages } from "@convex-dev/agent/react";
import { usePaginatedQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useThreadContext } from "@/features/chat/components/thread-context";
import { logThreadLoad, logThreadUpdate, providerLogger } from "@/lib/logger";

import type { ConvexMessage } from "../providers/types";
import { convertConvexMessage, isValidThreadMessage } from "../providers/types";

interface UseConvexThreadSyncerProperties {
    isRunning: boolean;
    model: AgentModel;
}

export const useConvexThreadSyncer = ({ isRunning, model }: UseConvexThreadSyncerProperties) => {
    const { currentThreadId, setThreads } = useThreadContext();
    const [isSyncPaused, setSyncPaused] = useState(false);
    const pauseTimeoutReference = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isRunning) {
            if (pauseTimeoutReference.current)
                clearTimeout(pauseTimeoutReference.current);

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
            if (pauseTimeoutReference.current)
                clearTimeout(pauseTimeoutReference.current);
        };
    }, [isRunning, isSyncPaused]);

    const paginatedMessagesArguments = useMemo(() => (currentThreadId === "default"
        ? "skip"
        : {
            model,
            threadId: currentThreadId,
        }), [currentThreadId, model]);

    const { isLoading: messagesAreLoading, results: convexMessages } = useThreadMessages(api.chat.functions.getThreadMessages, paginatedMessagesArguments, {
        initialNumItems: 50,
    });

    const { results: convexThreads } = usePaginatedQuery(api.chat.functions.getThreads, {}, { initialNumItems: 10 });

    const shouldUpdateMessages = useCallback((current: ThreadMessageLike[], newMessages: ThreadMessageLike[]) => {
        if (current.length !== newMessages.length)
            return true;

        if (current.length === 0)
            return false;

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
                if (currentMessage.content.length !== newMessage.content.length)
                    return true;

                const currentTextPart = currentMessage.content.find((c) => c.type === "text");
                const newTextPart = newMessage.content.find((c) => c.type === "text");

                if (currentTextPart?.type === "text" && newTextPart?.type === "text" && currentTextPart.text !== newTextPart.text)
                    return true;
            }
        }

        return false;
    }, []);

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
                setThreads((previous) => {
                    const current = previous.get(currentThreadId) || [];

                    providerLogger.debug("[Syncer] Checking for update", { currentCount: current.length, newCount: convertedMessages.length });

                    if (current.length > convertedMessages.length) {
                        providerLogger.debug("[Syncer] Skipping update: local state has optimistic messages (length check).");

                        return previous;
                    }

                    if (current.length !== convertedMessages.length || shouldUpdateMessages(current, convertedMessages)) {
                        logThreadUpdate(currentThreadId, convertedMessages.length);
                        providerLogger.debug("Updated to %d DB messages [isRunning: %s]", convertedMessages.length, isRunning);

                        return new Map(previous).set(currentThreadId, convertedMessages);
                    }

                    return previous;
                });
            }
        }
    }, [messagesAreLoading, convexMessages, currentThreadId, setThreads, shouldUpdateMessages, isRunning, isSyncPaused]);

    return { convexThreads, messagesAreLoading };
};
