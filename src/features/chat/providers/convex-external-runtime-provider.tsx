"use client";

import {
    AssistantRuntimeProvider,
    useExternalStoreRuntime,
    type ExternalStoreAdapter,
    type ThreadMessageLike,
    CompositeAttachmentAdapter,
} from "@assistant-ui/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useConvex } from "convex/react";
import ConvexAttachmentAdapter from "@/features/chat/adapter/convex-attachment-adapter";
import { useThreadContext } from "@/features/chat/components/thread-context";
import type { ConvexExternalRuntimeProviderProps } from "./types";
import { isValidThreadMessage } from "./types";
import { useMessageHandlers } from "../hooks/use-message-handlers";
import { useThreadListAdapter } from "./thread-list-adapter";
import { providerLogger } from "@/lib/logger";
import { useConvexThreadSyncer } from "../hooks/use-convex-thread-syncer";

export const ConvexExternalRuntimeProvider = ({ children, model, threadId, jwtToken }: ConvexExternalRuntimeProviderProps) => {
    const threadContext = useThreadContext();
    const convex = useConvex();

    const {
        currentThreadId,
        setCurrentThreadId,
        threads,
        setThreads,
        setThreadMetadata,
    } = threadContext;

    useEffect(() => {
        if (threadId && threadId !== currentThreadId) {
            providerLogger.info(
                "[Provider] Thread ID changed. Old: %s, New: %s",
                currentThreadId,
                threadId,
            );
            setCurrentThreadId(threadId);

            if (!threads.has(threadId)) {
                providerLogger.info("[Provider] Initializing new thread in context: %s", threadId);
                setThreads((prev) => new Map(prev).set(threadId, []));

                setThreadMetadata((prev) =>
                    new Map(prev).set(threadId, {
                        title: "New Chat",
                        status: "active",
                        createdAt: new Date(),
                        lastActivity: new Date(),
                    }),
                );
            }
        }
    }, [
        threadId,
        currentThreadId,
        setCurrentThreadId,
        threads,
        setThreads,
        setThreadMetadata,
    ]);

    const {
        handleNewMessage,
        handleEditMessage,
        handleReloadMessage,
        handleCancel,
        isRunning: streamIsRunning,
    } = useMessageHandlers({
        model,
        jwtToken,
    });

    const { convexThreads, messagesAreLoading } = useConvexThreadSyncer({
        model,
        isRunning: streamIsRunning,
    });

    const isRunning = streamIsRunning || messagesAreLoading;

    const currentMessages = useMemo(() => {
        const raw = threads.get(currentThreadId) || [];
        providerLogger.debug("[Provider] Selecting messages for UI. Raw count: %d", raw.length, { threadId: currentThreadId });
        const filtered = raw.filter((message) => {
            if (!isValidThreadMessage(message)) {
                providerLogger.error("[Provider] Invalid message found in state, filtering out.", { threadId: currentThreadId, message });
                return false;
            }
            return true;
        });
        providerLogger.debug("[Provider] Final filtered messages for UI. Count: %d", filtered.length, { threadId: currentThreadId, messages: filtered });
        return filtered;
    }, [threads, currentThreadId]);

    const threadListAdapter = useThreadListAdapter({
        model,
        currentThreadId,
    });

    const convexThreadsRef = useRef(convexThreads);
    convexThreadsRef.current = convexThreads;

    const wrappedHandleNewMessage = useCallback(
        (message: any) => {
            providerLogger.debug(
                "[Provider] 'onNew' triggered. Passing to handleNewMessage.",
                { content: message.content?.[0]?.text || "unknown" },
            );
            return handleNewMessage(message, {
                results: convexThreadsRef.current,
            });
        },
        [handleNewMessage],
    );

    const setMessages = useCallback(
        (messages: ThreadMessageLike[]) => {
            const currentCount = threads.get(currentThreadId)?.length ?? 0;
            providerLogger.debug(
                "[Provider] setMessages called. Current count: %d, New count: %d",
                currentCount,
                messages.length,
                { threadId: currentThreadId },
            );

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
            setThreads((prev) => new Map(prev).set(currentThreadId, validMessages));
        },
        [currentThreadId, setThreads],
    );

    const adapter: ExternalStoreAdapter<ThreadMessageLike> = useMemo(
        () => ({
            messages: currentMessages,
            isRunning,
            convertMessage: (message: ThreadMessageLike) => message,
            onNew: wrappedHandleNewMessage,
            onEdit: async (msg) => {
                providerLogger.debug("[Provider] 'onEdit' triggered.");
                return handleEditMessage(msg);
            },
            onReload: async (id) => {
                providerLogger.debug("[Provider] 'onReload' triggered.");
                return handleReloadMessage(id);
            },
            onCancel: async () => {
                providerLogger.debug("[Provider] 'onCancel' triggered.");
                return handleCancel();
            },
            setMessages,
            adapters: {
                attachments: new CompositeAttachmentAdapter([
                    new ConvexAttachmentAdapter(convex),
                ]),
                threadList: threadListAdapter,
            },
            unstable_capabilities: {
                copy: true,
            },
        }),
        [
            currentMessages,
            isRunning,
            wrappedHandleNewMessage,
            handleEditMessage,
            handleReloadMessage,
            handleCancel,
            setMessages,
            threadListAdapter,
            convex,
        ],
    );

    const runtime = useExternalStoreRuntime(adapter);

    return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
};
