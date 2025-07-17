"use client";

import { api } from "@anole/convex/api";
import type { ExternalStoreAdapter, ThreadMessageLike } from "@assistant-ui/react";
import { AssistantRuntimeProvider, CompositeAttachmentAdapter, useExternalStoreRuntime } from "@assistant-ui/react";
import { useConvex, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import ConvexAttachmentAdapter from "@/features/chat/adapter/convex-attachment-adapter";
import { useThreadContext } from "@/features/chat/components/thread-context";
import { providerLogger } from "@/lib/logger";

import { useConvexThreadSyncer } from "../hooks/use-convex-thread-syncer";
import { useMessageHandlers } from "../hooks/use-message-handlers";
import useThreadListAdapter from "./thread-list-adapter";
import type { ConvexExternalRuntimeProviderProperties } from "./types";
import { isValidThreadMessage } from "./types";

const ConvexExternalRuntimeProvider = ({ children, jwtToken, model, threadId }: ConvexExternalRuntimeProviderProperties) => {
    const threadContext = useThreadContext();
    const convex = useConvex();

    const { currentThreadId, setCurrentThreadId, setThreads, threads } = threadContext;

    // --- Fetch all threads for thread existence checks ---
    const allThreads = useQuery(api.chat.functions.getThreads, { paginationOpts: { cursor: null, numItems: 100 } });

    // --- PATCH: Only sync to valid, existing threadId ---
    useEffect(() => {
        if (!threadId || threadId === currentThreadId) return;

        // Check if threadId exists in backend thread list (allThreads.page)
        const threadExists = allThreads?.page?.some((t: any) => typeof t._id === "string" && t._id === threadId && t.status !== "deleted");

        if (!threadExists) {
            console.warn("[ConvexExternalRuntimeProvider] Refusing to switch to non-existent or deleted threadId:", threadId);

            return;
        }

        providerLogger.info("[Provider] Thread ID changed. Old: %s, New: %s", currentThreadId, threadId);

        setCurrentThreadId(threadId);
    }, [threadId, currentThreadId, allThreads]);

    const {
        handleCancel,
        handleEditMessage,
        handleNewMessage,
        handleReloadMessage,
        isRunning: streamIsRunning,
    } = useMessageHandlers({
        jwtToken,
        model,
    });

    const { convexThreads, messagesAreLoading } = useConvexThreadSyncer({
        isRunning: streamIsRunning,
        model,
    });

    const isRunning = streamIsRunning || messagesAreLoading;

    const currentMessages = useMemo(() => {
        const raw = threads.get(currentThreadId) || [];

        providerLogger.debug("[Provider] Selecting messages for UI. Raw count: %d", raw.length, { threadId: currentThreadId });
        const filtered = raw.filter((message) => {
            if (!isValidThreadMessage(message)) {
                providerLogger.error("[Provider] Invalid message found in state, filtering out.", { message, threadId: currentThreadId });

                return false;
            }

            return true;
        });

        providerLogger.debug("[Provider] Final filtered messages for UI. Count: %d", filtered.length, { messages: filtered, threadId: currentThreadId });

        return filtered;
    }, [threads, currentThreadId]);

    const threadListAdapter = useThreadListAdapter({
        currentThreadId,
        model,
    });

    const convexThreadsReference = useRef(convexThreads);

    convexThreadsReference.current = convexThreads;

    const wrappedHandleNewMessage = useCallback(
        (message: any) => {
            providerLogger.debug("[Provider] 'onNew' triggered. Passing to handleNewMessage.", { content: message.content?.[0]?.text || "unknown" });

            return handleNewMessage(message, {
                results: convexThreadsReference.current,
            });
        },
        [handleNewMessage],
    );

    const setMessages = useCallback(
        (messages: ThreadMessageLike[]) => {
            const currentCount = threads.get(currentThreadId)?.length ?? 0;

            providerLogger.debug("[Provider] setMessages called. Current count: %d, New count: %d", currentCount, messages.length, {
                threadId: currentThreadId,
            });

            const validMessages = messages.filter((message) => {
                if (!isValidThreadMessage(message)) {
                    providerLogger.warn("[Provider] Invalid message detected in setMessages, filtering out.", { message });

                    return false;
                }

                return true;
            });

            providerLogger.debug(
                "[Provider] Setting messages for thread. Valid count: %d, IDs: %s",
                currentThreadId,
                validMessages.length,
                validMessages.map((m) => m.id).join(", "),
            );
            setThreads((previous) => new Map(previous).set(currentThreadId, validMessages));
        },
        [currentThreadId, setThreads, threads],
    );

    const adapter: ExternalStoreAdapter<ThreadMessageLike> = useMemo(() => {
        return {
            adapters: {
                attachments: new CompositeAttachmentAdapter([new ConvexAttachmentAdapter(convex)]),
                threadList: threadListAdapter,
            },
            convertMessage: (message: ThreadMessageLike) => message,
            isRunning,
            messages: currentMessages,
            onCancel: async () => {
                providerLogger.debug("[Provider] 'onCancel' triggered.");

                handleCancel();
            },
            onEdit: async (message) => {
                providerLogger.debug("[Provider] 'onEdit' triggered.");

                return handleEditMessage(message);
            },
            onNew: wrappedHandleNewMessage,
            onReload: async (id) => {
                providerLogger.debug("[Provider] 'onReload' triggered.");

                return handleReloadMessage(id);
            },
            setMessages,
            unstable_capabilities: {
                copy: true,
            },
        };
    }, [currentMessages, isRunning, wrappedHandleNewMessage, handleEditMessage, handleReloadMessage, handleCancel, setMessages, threadListAdapter, convex]);

    const runtime = useExternalStoreRuntime(adapter);

    return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
};

export default ConvexExternalRuntimeProvider;
