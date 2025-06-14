"use client";

import {
    AssistantRuntimeProvider,
    useExternalStoreRuntime,
    type AppendMessage,
    type ThreadMessageLike,
    type ExternalStoreAdapter,
    type ExternalStoreThreadData,
    type ExternalStoreThreadListAdapter,
    CompositeAttachmentAdapter,
} from "@assistant-ui/react";
import type { ReactNode } from "react";
import type { AgentModel } from "convex/agents";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/hooks/auth-hooks";
import { api } from "@cvx/_generated/api";
import { useThreadMessages } from "@convex-dev/agent/react";
import { asAsyncIterableStream } from "assistant-stream/utils";
import { AssistantMessageAccumulator, DataStreamDecoder } from "assistant-stream";
import ConvexAttachmentAdapter from "./adapter/convex-attachment-adapter";
import { useMutation, usePaginatedQuery } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { useThreadContext, ThreadProvider } from "./thread-context";

// Define our message format that matches Convex agent messages
export type ConvexMessage = {
    _id: string;
    _creationTime: number;
    message: {
        role: "user" | "assistant" | "system";
        content:
            | string
            | Array<{
                  type: "text";
                  text: string;
              }>;
    };
};

interface ConvexExternalRuntimeProviderProps {
    children: ReactNode;
    model: AgentModel;
    threadId?: string;
}

const generateId = () => Math.random().toString(36).slice(2);

const convertConvexMessage = (message: ConvexMessage): ThreadMessageLike => {
    const role = message.message.role;
    const content = message.message.content;

    let displayContent: string;

    if (typeof content === "string") {
        displayContent = content;
    } else if (Array.isArray(content)) {
        displayContent = content
            .map((part) => {
                if (part.type === "text") {
                    return part.text;
                }
                return `[unsupported content: ${part.type}]`;
            })
            .join("");
    } else {
        displayContent = "";
    }

    return {
        id: message._id,
        role: role,
        content: [{ type: "text", text: displayContent }],
        createdAt: new Date(message._creationTime),
    };
};

export const ConvexExternalRuntimeProvider = ({ children, model, threadId }: ConvexExternalRuntimeProviderProps) => {
    const navigate = useNavigate();
    const sessionData = useSession();
    const threadContext = useThreadContext();
    const [isRunning, setIsRunning] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const { currentThreadId, setCurrentThreadId, threads, setThreads, threadMetadata, setThreadMetadata } = threadContext;

    useEffect(() => {
        if (threadId && threadId !== currentThreadId) {
            setCurrentThreadId(threadId);

            // Initialize thread if it doesn't exist
            if (!threads.has(threadId)) {
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
    }, [threadId, currentThreadId, setCurrentThreadId, threads, setThreads, setThreadMetadata]);

    const currentMessages = threads.get(currentThreadId) || [];
    // Currently tanstack query has no other way to check if a query is skipped
    const paginatedMessagesArgs =
        currentThreadId !== "default"
            ? {
                  threadId: currentThreadId,
                  model: model,
                  sessionToken: sessionData?.data?.session?.token,
              }
            : "skip";

    const paginatedMessages = useThreadMessages(api.chat.listMessages, paginatedMessagesArgs, { initialNumItems: 50 });

    const convexThreads = usePaginatedQuery(api.chat.getThreads, { sessionToken: sessionData?.data?.session?.token as string }, { initialNumItems: 10 });
    const updateThread = useMutation(api.chat.updateThread);
    const deleteThread = useMutation(api.chat.deleteThreadWithRelationships);
    const createThreadMutation = useMutation(api.chat.createThread);

    useEffect(() => {
        setIsRunning(paginatedMessagesArgs === "skip" ? false : paginatedMessages.isLoading);
    }, [paginatedMessages.isLoading]);

    useEffect(() => {
        if (!paginatedMessages.isLoading && paginatedMessages.results && currentThreadId) {
            const newConvertedMessages = paginatedMessages.results.map(convertConvexMessage);

            setThreads((prev) => new Map(prev).set(currentThreadId, newConvertedMessages));
        }
    }, [paginatedMessages.isLoading, currentThreadId, setThreads]);

    const streamMessage = useCallback(
        async (input: string, targetThreadId?: string) => {
            if (!sessionData?.data?.session?.token) {
                throw new Error("No session token available");
            }

            // Use provided thread ID or current thread ID
            const useThreadId = targetThreadId || currentThreadId;

            // Create new abort controller for this request
            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            setIsRunning(true);

            const assistantId = generateId();
            const assistantMessage: ThreadMessageLike = {
                role: "assistant",
                id: assistantId,
                content: [{ type: "text", text: "" }],
            };

            setThreads((prev) => {
                const currentThreadMessages = prev.get(useThreadId) || [];

                return new Map(prev).set(useThreadId, [...currentThreadMessages, assistantMessage]);
            });

            try {
                const result = await fetch(`/convex-http/chat/stream`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: input,
                        threadId: useThreadId,
                        model: model,
                        sessionToken: sessionData.data.session.token,
                    }),
                    signal: abortController.signal,
                });

                if (!result.ok) {
                    const text = await result.text();
                    throw new Error(`${result.status} ${text}`);
                }

                if (!result.body) {
                    throw new Error("Response body is null");
                }

                const stream = result.body.pipeThrough(new DataStreamDecoder()).pipeThrough(new AssistantMessageAccumulator());

                for await (const message of asAsyncIterableStream(stream)) {
                    if (abortController.signal.aborted) {
                        break;
                    }

                    if (message.parts.length > 0 && message.parts[0].type === "text") {
                        const textPart = message.parts[0];
                        if ("text" in textPart) {
                            setThreads((prev) => {
                                const currentThreadMessages = prev.get(useThreadId) || [];
                                const updatedMessages = currentThreadMessages.map((m) =>
                                    m.id === assistantId
                                        ? {
                                              ...m,
                                              content: [{ type: "text" as const, text: textPart.text }],
                                          }
                                        : m,
                                );
                                return new Map(prev).set(useThreadId, updatedMessages);
                            });
                        }
                    }
                }
            } catch (error) {
                // Don't show error if request was cancelled
                if (error instanceof Error && error.name === "AbortError") {
                    console.log("Stream cancelled by user");
                    return;
                }

                console.error("Stream error:", error);
                // Update assistant message with error
                setThreads((prev) => {
                    const currentThreadMessages = prev.get(useThreadId) || [];
                    const updatedMessages = currentThreadMessages.map((m) =>
                        m.id === assistantId
                            ? {
                                  ...m,
                                  content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` }],
                              }
                            : m,
                    );
                    return new Map(prev).set(useThreadId, updatedMessages);
                });
            } finally {
                setIsRunning(false);
                abortControllerRef.current = null;
            }
        },
        [currentThreadId, model, sessionData, setThreads],
    );

    // Handler for new messages
    const handleNewMessage = useCallback(
        async (message: AppendMessage) => {
            if (message.content[0]?.type !== "text") {
                throw new Error("Only text messages are supported");
            }

            const input = message.content[0].text;

            // Check if we need to create the thread in Convex first
            let actualThreadId = currentThreadId;
            if (sessionData?.data?.session?.token) {
                try {
                    // This is a local thread, create it in Convex
                    actualThreadId = await createThreadMutation({
                        model,
                        sessionToken: sessionData.data.session.token,
                    });

                    // Update our local state to use the Convex thread ID
                    const currentMessages = threads.get(currentThreadId) || [];
                    const currentMetadata = threadMetadata.get(currentThreadId) || { title: "New Chat", status: "active" as const };

                    // Remove old local thread and add new Convex thread
                    setThreads((prev) => {
                        const next = new Map(prev);
                        next.delete(currentThreadId);
                        next.set(actualThreadId, currentMessages);
                        return next;
                    });

                    setThreadMetadata((prev) => {
                        const next = new Map(prev);
                        next.delete(currentThreadId);
                        next.set(actualThreadId, currentMetadata);
                        return next;
                    });

                    setCurrentThreadId(actualThreadId);
                    navigate({ to: "/chat/$threadId", params: { threadId: actualThreadId }, replace: true });
                } catch (error) {
                    console.error("Failed to create thread in Convex:", error);
                    // Continue with local thread ID
                }
            }

            const userMessage: ThreadMessageLike = {
                role: "user",
                id: generateId(),
                content: [{ type: "text", text: input }],
                createdAt: new Date(),
            };

            // Optimistically add user message to current thread
            setThreads((prev) => {
                const currentThreadMessages = prev.get(actualThreadId) || [];
                return new Map(prev).set(actualThreadId, [...currentThreadMessages, userMessage]);
            });

            // Stream the assistant response
            await streamMessage(input, actualThreadId);
        },
        [
            streamMessage,
            currentThreadId,
            setThreads,
            createThreadMutation,
            model,
            sessionData,
            threads,
            threadMetadata,
            setThreadMetadata,
            setCurrentThreadId,
            navigate,
        ],
    );

    // Handler for message editing
    const handleEditMessage = useCallback(
        async (message: AppendMessage) => {
            if (message.content[0]?.type !== "text") {
                throw new Error("Only text messages are supported");
            }

            const currentThreadMessages = threads.get(currentThreadId) || [];
            const index = currentThreadMessages.findIndex((m) => m.id === message.parentId) + 1;
            const newMessages = [...currentThreadMessages.slice(0, index)];

            const editedMessage: ThreadMessageLike = {
                role: "user",
                content: message.content,
                id: generateId(),
                createdAt: new Date(),
            };

            newMessages.push(editedMessage);
            setThreads((prev) => new Map(prev).set(currentThreadId, newMessages));

            await streamMessage(message.content[0].text);
        },
        [threads, currentThreadId, setThreads, streamMessage],
    );

    // Handler for message reload/regeneration
    const handleReloadMessage = useCallback(
        async (parentId: string | null) => {
            if (!parentId) return;

            const currentThreadMessages = threads.get(currentThreadId) || [];
            const index = currentThreadMessages.findIndex((m) => m.id === parentId);
            if (index === -1) return;

            const lastUserMessage = currentThreadMessages[index];
            if (lastUserMessage?.role !== "user") return;

            const newMessages = currentThreadMessages.slice(0, index + 1);
            setThreads((prev) => new Map(prev).set(currentThreadId, newMessages));

            // Safely access content with type checking
            const content = lastUserMessage.content;
            if (Array.isArray(content) && content[0] && typeof content[0] === "object" && "type" in content[0] && content[0].type === "text") {
                await streamMessage(content[0].text);
            } else if (typeof content === "string") {
                await streamMessage(content);
            }
        },
        [threads, currentThreadId, setThreads, streamMessage],
    );

    // Handler for cancelling ongoing requests
    const handleCancel = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsRunning(false);
        }
    }, []);

    // Enhanced thread list adapter following ExternalStoreRuntime best practices
    const threadListAdapter: ExternalStoreThreadListAdapter = useMemo(() => {
        // Combine Convex threads with local thread metadata
        const convexThreadList: ExternalStoreThreadData<"regular" | "archived">[] = convexThreads.results.map((t) => ({
            threadId: t._id,
            status: t.status === "active" ? "regular" : "archived",
            title: t.title || "New Chat",
        }));

        // Add local threads that might not be in Convex yet
        const localThreadList: ExternalStoreThreadData<"regular" | "archived">[] = [];

        for (const [threadId, metadata] of threadMetadata.entries()) {
            if (!convexThreadList.find((t) => t.threadId === threadId)) {
                localThreadList.push({
                    threadId,
                    status: metadata.status === "active" ? "regular" : "archived",
                    title: metadata.title,
                });
            }
        }

        const allThreads = [...convexThreadList, ...localThreadList];

        return {
            threadId: currentThreadId,
            threads: allThreads.filter((t) => t.status === "regular") as ExternalStoreThreadData<"regular">[],
            archivedThreads: allThreads.filter((t) => t.status === "archived") as ExternalStoreThreadData<"archived">[],

            onSwitchToNewThread: async () => {
                if (!sessionData?.data?.session?.token) {
                    console.error("No session token available for creating thread");
                    return;
                }

                const newThreadId = await createThreadMutation({
                    model,
                    sessionToken: sessionData.data.session.token,
                });

                // Initialize new thread in context
                setThreads((prev) => new Map(prev).set(newThreadId, []));
                setThreadMetadata((prev) =>
                    new Map(prev).set(newThreadId, {
                        title: "New Chat",
                        status: "active",
                        createdAt: new Date(),
                        lastActivity: new Date(),
                    }),
                );
                setCurrentThreadId(newThreadId);

                navigate({ to: "/chat/$threadId", params: { threadId: newThreadId }, replace: true });
            },

            onSwitchToThread: async (switchThreadId) => {
                if (!threads.has(switchThreadId)) {
                    setThreads((prev) => new Map(prev).set(switchThreadId, []));
                }

                if (!threadMetadata.has(switchThreadId)) {
                    setThreadMetadata((prev) =>
                        new Map(prev).set(switchThreadId, {
                            title: "Chat",
                            status: "active",
                            createdAt: new Date(),
                            lastActivity: new Date(),
                        }),
                    );
                }

                setCurrentThreadId(switchThreadId);
                navigate({ to: "/chat/$threadId", params: { threadId: switchThreadId } });
            },

            onRename: async (renameThreadId, newTitle) => {
                setThreadMetadata((prev) => {
                    const current = prev.get(renameThreadId) || {
                        title: "Chat",
                        status: "active",
                        createdAt: new Date(),
                        lastActivity: new Date(),
                    };

                    return new Map(prev).set(renameThreadId, {
                        ...current,
                        title: newTitle,
                        lastActivity: new Date(),
                    });
                });

                if (sessionData?.data?.session?.token) {
                    await updateThread({
                        threadId: renameThreadId,
                        title: newTitle,
                        sessionToken: sessionData.data.session.token,
                        model,
                    });
                }
            },

            onArchive: async (archiveThreadId) => {
                // Update local metadata immediately
                setThreadMetadata((prev) => {
                    const current = prev.get(archiveThreadId) || {
                        title: "Chat",
                        status: "active",
                        createdAt: new Date(),
                        lastActivity: new Date(),
                    };
                    return new Map(prev).set(archiveThreadId, {
                        ...current,
                        status: "archived",
                        lastActivity: new Date(),
                    });
                });

                // Sync with Convex if session available
                if (sessionData?.data?.session?.token) {
                    await updateThread({
                        threadId: archiveThreadId,
                        status: "archived",
                        sessionToken: sessionData.data.session.token,
                        model,
                    });
                }
            },

            onUnarchive: async (unarchiveThreadId) => {
                // Update local metadata immediately
                setThreadMetadata((prev) => {
                    const current = prev.get(unarchiveThreadId) || {
                        title: "Chat",
                        status: "archived",
                        createdAt: new Date(),
                        lastActivity: new Date(),
                    };
                    return new Map(prev).set(unarchiveThreadId, {
                        ...current,
                        status: "active",
                        lastActivity: new Date(),
                    });
                });

                // Sync with Convex if session available
                if (sessionData?.data?.session?.token) {
                    await updateThread({
                        threadId: unarchiveThreadId,
                        status: "active",
                        sessionToken: sessionData.data.session.token,
                        model,
                    });
                }
            },

            onDelete: async (deleteThreadId) => {
                // Remove from local context
                setThreads((prev) => {
                    const next = new Map(prev);
                    next.delete(deleteThreadId);
                    return next;
                });
                setThreadMetadata((prev) => {
                    const next = new Map(prev);
                    next.delete(deleteThreadId);
                    return next;
                });

                // Switch to default thread if deleting current thread
                if (currentThreadId === deleteThreadId) {
                    setCurrentThreadId("default");
                    navigate({ to: "/chat" });
                }

                // Sync with Convex if session available
                if (sessionData?.data?.session?.token) {
                    await deleteThread({
                        threadId: deleteThreadId,
                        sessionToken: sessionData.data.session.token,
                    });
                }
            },
        };
    }, [
        convexThreads.results,
        currentThreadId,
        threadMetadata,
        threads,
        setCurrentThreadId,
        setThreads,
        setThreadMetadata,
        navigate,
        sessionData,
        updateThread,
        deleteThread,
        model,
        createThreadMutation,
    ]);

    // Create the external store adapter
    const adapter: ExternalStoreAdapter<ThreadMessageLike> = useMemo(
        () => ({
            messages: currentMessages,
            isRunning,
            convertMessage: (message: ThreadMessageLike) => message, // Identity function since we're already in the correct format
            onNew: handleNewMessage,
            onEdit: handleEditMessage,
            onReload: handleReloadMessage,
            onCancel: handleCancel,
            setMessages: (messages: ThreadMessageLike[]) => {
                setThreads((prev) => new Map(prev).set(currentThreadId, messages));
            },
            adapters: {
                attachments: new CompositeAttachmentAdapter([
                    new ConvexAttachmentAdapter(sessionData?.data?.session?.token as string, threadId as string, model),
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
            handleNewMessage,
            handleEditMessage,
            handleReloadMessage,
            handleCancel,
            currentThreadId,
            setThreads,
            sessionData?.data?.session?.token,
            model,
            threadListAdapter,
        ],
    );

    // Create the runtime
    const runtime = useExternalStoreRuntime(adapter);

    return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
};

// Re-export ThreadProvider for convenience
export { ThreadProvider };
