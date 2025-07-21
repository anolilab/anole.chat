"use client";

import type { AgentModel } from "@anole/convex/ai/lib/agents";
import { api } from "@anole/convex/api";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { useQuery } from "convex-helpers/react/cache";
import type { FC, PropsWithChildren } from "react";
import { useCallback, useMemo } from "react";

import { providerLogger } from "@/lib/logger";

import { useThreads, useMessagesSorted } from "../collections/query-collection";
import { useConvexThreadSyncer } from "../hooks/use-convex-thread-syncer-tanstack";
import { useMessageHandlers } from "../hooks/use-message-handlers-tanstack";
import { useThreadContext } from "../components/thread-context-tanstack";

import type { ThreadListAdapter } from "./thread-list-adapter";
import type { ConvexExternalRuntimeProviderProperties } from "./types";

export const ConvexExternalRuntimeProvider: FC<ConvexExternalRuntimeProviderProperties> = ({
    children,
    convex,
    model,
    streamIsRunning,
    threadListAdapter,
}) => {
    const { currentThreadId } = useThreadContext();

    // Query to get all threads for building the hierarchy
    const allThreads = useQuery(api.chat.functions.getThreads, { paginationOpts: { cursor: null, numItems: 100 } });

    // Get local data using TanStack DB hooks
    const localThreads = useThreads();
    const localMessages = useMessagesSorted(currentThreadId);

    const { convexThreads, messagesAreLoading } = useConvexThreadSyncer({
        isRunning: streamIsRunning,
        model,
        currentThreadId,
    });

    const isRunning = streamIsRunning || messagesAreLoading;

    const currentMessages = useMemo(() => {
        const raw = localMessages || [];
        providerLogger.debug("[Provider] Selecting messages for UI. Raw count: %d", raw.length, { threadId: currentThreadId });

        const filtered = raw.filter((message) => {
            if (!message || !message.id || !message.role || !Array.isArray(message.content)) {
                providerLogger.warn("[Provider] Invalid message detected, filtering out.", { message });
                return false;
            }

            return true;
        });

        providerLogger.debug("[Provider] Final filtered messages for UI. Count: %d", filtered.length, { messages: filtered, threadId: currentThreadId });

        return filtered;
    }, [localMessages, currentThreadId]);

    const setMessages = useCallback(
        (messages: ThreadMessageLike[]) => {
            const currentCount = currentMessages.length;
            providerLogger.debug("[Provider] setMessages called. Current count: %d, New count: %d", currentCount, messages.length, {
                threadId: currentThreadId,
            });

            const validMessages = messages.filter((message) => {
                if (!message || !message.id || !message.role || !Array.isArray(message.content)) {
                    providerLogger.warn("[Provider] Invalid message detected in setMessages, filtering out.", { message });
                    return false;
                }

                return true;
            });

            providerLogger.debug(
                "[Provider] Setting messages for thread. Valid count: %d, IDs: %s",
                {
                    threadId: currentThreadId,
                },
                validMessages.length,
                validMessages.map((m) => m.id).join(", "),
            );

            // This would need to be implemented to update messages in the TanStack DB
            // For now, we'll need to add this functionality to the messages collection
            console.warn("setMessages not yet implemented for TanStack DB");
        },
        [currentMessages.length, currentThreadId],
    );

    const wrappedHandleNewMessage = useCallback(
        (message: any) => {
            // This would need to be implemented to handle new messages
            console.warn("wrappedHandleNewMessage not yet implemented for TanStack DB");
        },
        [],
    );

    const handleEditMessage = useCallback(
        (messageId: string, newContent: ThreadMessageLike["content"]) => {
            // This would need to be implemented to handle message editing
            console.warn("handleEditMessage not yet implemented for TanStack DB");
        },
        [],
    );

    const handleReloadMessage = useCallback(
        (messageId: string) => {
            // This would need to be implemented to handle message reloading
            console.warn("handleReloadMessage not yet implemented for TanStack DB");
        },
        [],
    );

    const handleCancel = useCallback(() => {
        // This would need to be implemented to handle cancellation
        console.warn("handleCancel not yet implemented for TanStack DB");
    }, []);

    const contextValue = useMemo(
        () => ({
            convex,
            isRunning,
            messages: currentMessages,
            setMessages,
            handleNewMessage: wrappedHandleNewMessage,
            handleEditMessage,
            handleReloadMessage,
            handleCancel,
            threadListAdapter,
        }),
        [convex, isRunning, currentMessages, setMessages, wrappedHandleNewMessage, handleEditMessage, handleReloadMessage, handleCancel, threadListAdapter],
    );

    return <>{children}</>;
};