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
    type FeedbackAdapter,
} from "@assistant-ui/react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/features/auth/hooks/auth-hooks";
import { api } from "@cvx/_generated/api";
import { useThreadMessages } from "@convex-dev/agent/react";
import { asAsyncIterableStream } from "assistant-stream/utils";
import { AssistantMessageAccumulator, DataStreamDecoder } from "assistant-stream";
import ConvexAttachmentAdapter from "@/features/chat/components/adapter/convex-attachment-adapter";
import { useMutation, usePaginatedQuery, useAction, useConvex } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { useThreadContext } from "@/features/chat/components/thread-context";
import type { AgentModel } from "@cvx/ai/lib/agents";

// Define our message format that matches Convex agent messages
export type ConvexMessage = {
    _id: string;
    _creationTime: number;
    id?: string;
    userId?: string;
    embeddingId?: string;
    fileIds?: string[];
    error?: string;
    agentName?: string;
    tool: boolean;
    message?: {
        role: "user" | "assistant" | "system";
        content:
            | string
            | Array<
                  | {
                        type: "text";
                        text: string;
                    }
                  | {
                        type: "image";
                        image: string;
                    }
              >;
    };
};

interface ConvexExternalRuntimeProviderProps {
    children: ReactNode;
    model: AgentModel;
    threadId?: string;
}

const generateId = () => Math.random().toString(36).slice(2);

const convertConvexMessage = (message: ConvexMessage): ThreadMessageLike => {
    if (!message.message) {
        // Handle case where message is undefined
        return {
            id: message._id,
            role: "assistant",
            content: [{ type: "text", text: message.error || "Error: No message content" }],
            createdAt: new Date(message._creationTime),
        };
    }

    const role = message.message.role;
    const content = message.message.content;

    let messageContent: Array<{ type: "text"; text: string } | { type: "image"; image: string }> = [];

    if (typeof content === "string") {
        messageContent = [{ type: "text", text: content }];
    } else if (Array.isArray(content)) {
        messageContent = content.map((part) => {
            if (part.type === "text") {
                return { type: "text", text: part.text };
            } else if (part.type === "image" && part.image) {
                return { type: "image", image: part.image };
            }

            return { type: "text", text: `[unsupported content: ${part.type}]` };
        });
    } else {
        messageContent = [{ type: "text", text: "" }];
    }

    return {
        id: message._id,
        role: role,
        content: messageContent,
        createdAt: new Date(message._creationTime),
    };
};

export const ConvexExternalRuntimeProvider = ({ children, model, threadId }: ConvexExternalRuntimeProviderProps) => {
    const navigate = useNavigate();
    const sessionData = useSession();
    const threadContext = useThreadContext();
    const convex = useConvex();
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
        currentThreadId !== "default" && sessionData?.data?.session?.token
            ? {
                  threadId: currentThreadId,
                  model: model,
                  sessionToken: sessionData.data.session.token,
              }
            : "skip";

    const paginatedMessages = useThreadMessages(api.chat.functions.listMessages, paginatedMessagesArgs, { initialNumItems: 50 });

    const convexThreads = usePaginatedQuery(
        api.chat.functions.getThreads,
        { sessionToken: sessionData?.data?.session?.token as string },
        { initialNumItems: 10 },
    );
    const updateThreadMutation = useAction(api.chat.functions.updateThread);
    const deleteThread = useMutation(api.chat.functions.deleteThreadWithRelationships);
    const createThreadMutation = useMutation(api.chat.functions.createThread);

    useEffect(() => {
        setIsRunning(paginatedMessagesArgs === "skip" ? false : paginatedMessages.isLoading);
    }, [paginatedMessages.isLoading]);

    useEffect(() => {
        if (!paginatedMessages.isLoading && paginatedMessages.results && currentThreadId) {
            const newConvertedMessages = paginatedMessages.results.map((message) => convertConvexMessage(message as unknown as ConvexMessage));

            setThreads((prev) => new Map(prev).set(currentThreadId, newConvertedMessages));
        }
    }, [paginatedMessages.isLoading, currentThreadId, setThreads]);

    const streamMessage = useCallback(
        async (input: string, targetThreadId?: string, fileIds?: string[]) => {
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
                        model,
                        sessionToken: sessionData.data.session.token,
                        fileIds,
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
            // Extract text content and file IDs from attachments
            let textContent = "";
            const fileIds: string[] = [];
            const messageContent: Array<{ type: "text"; text: string } | { type: "image"; image: string }> = [];

            // Process message content
            for (const content of message.content) {
                if (content.type === "text") {
                    textContent += content.text;
                    messageContent.push({ type: "text", text: content.text });
                } else if (content.type === "image" && content.image) {
                    // Add image content to the message
                    messageContent.push({ type: "image", image: content.image });

                    // Extract fileId from metadata if available
                    const attachment = message.attachments?.find((att) => att.content?.some((c) => c.type === "image" && c.image === content.image));
                    if (attachment && "metadata" in attachment && attachment.metadata && (attachment.metadata as any).fileId) {
                        fileIds.push((attachment.metadata as any).fileId);
                    }
                }
            }

            // Also check for file attachments directly
            if (message.attachments) {
                for (const attachment of message.attachments) {
                    if (
                        attachment &&
                        "metadata" in attachment &&
                        attachment.metadata &&
                        (attachment.metadata as any).fileId &&
                        !fileIds.includes((attachment.metadata as any).fileId)
                    ) {
                        fileIds.push((attachment.metadata as any).fileId);
                    }
                }
            }

            const input = textContent;

            // Check if we need to create the thread in Convex first
            let actualThreadId = currentThreadId;
            const isLocalThread = currentThreadId === "default" || !convexThreads.results.some((t) => t._id === currentThreadId);

            if (sessionData?.data?.session?.token && isLocalThread) {
                try {
                    // This is a local thread, create it in Convex
                    actualThreadId = await createThreadMutation({
                        model,
                        sessionToken: sessionData.data.session.token,
                        branchName: "New Chat",
                    });

                    // Update our local state to use the Convex thread ID
                    const currentMessages = threads.get(currentThreadId) || [];
                    const currentMetadata = threadMetadata.get(currentThreadId) || {
                        title: "New Chat",
                        status: "active" as const,
                        createdAt: new Date(),
                        lastActivity: new Date(),
                    };

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

                    navigate({ to: "/chat/$threadId", params: { threadId: actualThreadId }, replace: true, search: { initialMessage: undefined } });
                } catch (error) {
                    console.error("Failed to create thread in Convex:", error);
                    // Continue with local thread ID
                }
            }

            const userMessage: ThreadMessageLike = {
                role: "user",
                id: generateId(),
                content: messageContent.length > 0 ? messageContent : [{ type: "text", text: input }],
                createdAt: new Date(),
                attachments: message.attachments,
            };

            // Optimistically add user message to current thread
            setThreads((prev) => {
                const currentThreadMessages = prev.get(actualThreadId) || [];
                return new Map(prev).set(actualThreadId, [...currentThreadMessages, userMessage]);
            });

            // Stream the assistant response
            await streamMessage(input, actualThreadId, fileIds);
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
                    branchName: "New Chat",
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

                navigate({ to: "/chat/$threadId", params: { threadId: newThreadId }, replace: true, search: { initialMessage: undefined } });
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
                navigate({ to: "/chat/$threadId", params: { threadId: switchThreadId }, search: { initialMessage: undefined } });
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
                    await updateThreadMutation({
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
                    await updateThreadMutation({
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
                    await updateThreadMutation({
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
        updateThreadMutation,
        deleteThread,
        model,
        createThreadMutation,
    ]);

    // TODO: Improve the message feedback
    // const feedbackAdapter: FeedbackAdapter = {
    //     async submit(feedback) {
    //         await createFeedback({
    //             messageId: feedback.message.id,
    //             feedback: feedback.type,
    //             sessionToken: sessionData?.data?.session?.token as string,
    //         });
    //     },
    // };

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
                attachments: new CompositeAttachmentAdapter([new ConvexAttachmentAdapter(sessionData?.data?.session?.token as string, convex)]),
                threadList: threadListAdapter,
                //feedback: feedbackAdapter,
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
            convex,
        ],
    );

    // Create the runtime
    const runtime = useExternalStoreRuntime(adapter);

    return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
};
