import { useCallback } from "react";
import type { AppendMessage, ThreadMessageLike } from "@assistant-ui/react";
import { useMutation } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@convex/_generated/api";
import { useThreadContext } from "@/features/chat/components/thread-context";
import type { AgentModel } from "@convex/ai/lib/agents";
import { generateId, isValidThreadMessage } from "../providers/types";
import { useStreamManager } from "./use-stream-manager";
import { providerLogger } from "@/lib/logger";

interface UseMessageHandlersProps {
    model: AgentModel;
    jwtToken: string;
}

export const useMessageHandlers = ({ model, jwtToken }: UseMessageHandlersProps) => {
    const navigate = useNavigate();
    const threadContext = useThreadContext();
    const { currentThreadId, setCurrentThreadId, threads, setThreads, threadMetadata, setThreadMetadata } = threadContext;
    const createThreadMutation = useMutation(api.chat.functions.createThread);

    const onStreamStart = useCallback(
        (threadId: string, messageId: string) => {
            const assistantMessage: ThreadMessageLike = {
                role: "assistant",
                id: messageId,
                content: [{ type: "text", text: "" }],
            };

            if (!isValidThreadMessage(assistantMessage)) {
                providerLogger.error("[Handlers] Invalid optimistic assistant message created", { assistantMessage });
                return;
            }

            providerLogger.debug("[Handlers] Adding optimistic assistant message", { threadId, messageId });
            setThreads((prev) => {
                const newThreads = new Map(prev);
                const currentMessages = newThreads.get(threadId) || [];
                newThreads.set(threadId, [...currentMessages, assistantMessage]);
                return newThreads;
            });
        },
        [setThreads],
    );

    const onStreamUpdate = useCallback(
        (threadId: string, messageId: string, content: ThreadMessageLike["content"]) => {
            setThreads((prev) => {
                const newThreads = new Map(prev);
                const currentMessages = newThreads.get(threadId) || [];
                const messageIndex = currentMessages.findIndex((m) => m.id === messageId);
                if (messageIndex === -1) {
                    console.warn("Message to update not found", messageId);
                    return prev;
                }

                const updatedMessage = {
                    ...currentMessages[messageIndex],
                    content,
                };
                if (!isValidThreadMessage(updatedMessage)) {
                    console.warn("Invalid updated message:", updatedMessage);
                    return prev;
                }

                const updatedMessages = [...currentMessages];
                updatedMessages[messageIndex] = updatedMessage;
                newThreads.set(threadId, updatedMessages);
                return newThreads;
            });
        },
        [setThreads],
    );

    const onStreamError = useCallback(
        (threadId: string, messageId: string, error: Error) => {
            providerLogger.error("[Handlers] Stream error", { threadId, messageId, error: error.message, stack: error.stack });
            onStreamUpdate(threadId, messageId, [
                {
                    type: "text",
                    text: `Error: ${error.message}`,
                },
            ]);
        },
        [onStreamUpdate],
    );

    const onStreamSuccess = useCallback((threadId: string, messageId: string) => {
        providerLogger.info("[Handlers] Stream completed successfully", { threadId, messageId });
    }, []);

    const { streamMessage, cancelStream, isRunning } = useStreamManager({
        model,
        jwtToken,
        onStreamStart,
        onStreamUpdate,
        onStreamError,
        onStreamSuccess,
    });

    const handleNewMessage = useCallback(
        async (message: AppendMessage, convexThreads: { results: any[] }) => {
            let textContent = "";
            const fileIds: string[] = [];
            const messageContent: Array<{ type: "text"; text: string } | { type: "image"; image: string }> = [];

            for (const content of message.content) {
                if (content.type === "text" && content.text) {
                    textContent += content.text;
                    messageContent.push({ type: "text", text: content.text });
                }
            }

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

            providerLogger.debug("[Handlers] handleNewMessage called", {
                currentThreadId,
                hasAttachments: !!message.attachments?.length,
            });

            let actualThreadId = currentThreadId;
            if (currentThreadId === "default" || !convexThreads.results.some((t: any) => t._id === currentThreadId)) {
                try {
                    providerLogger.info("[Handlers] No active thread found or current is 'default'. Creating new thread.");
                    actualThreadId = await createThreadMutation({
                        model,
                        branchName: "New Chat",
                    });

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
                    navigate({
                        
                        to: "/chat/$threadId",
                        params: { threadId: actualThreadId },
                        replace: true,
                        search: { initialMessage: undefined },
                    });
                    providerLogger.info("[Handlers] Created new thread and navigated", { newThreadId: actualThreadId });
                } catch (error) {
                    console.error("Failed to create thread in Convex:", error);
                }
            }

            const userMessage: ThreadMessageLike = {
                role: "user",
                id: generateId(),
                content: messageContent.length ? messageContent : [{ type: "text", text: textContent }],
                createdAt: new Date(),
                attachments: message.attachments,
            };

            if (!isValidThreadMessage(userMessage)) {
                providerLogger.error("[Handlers] Invalid user message created", { userMessage });
                return;
            }

            providerLogger.debug("[Handlers] Adding user message", { actualThreadId, userMessage });
            setThreads((prev) => {
                const currentThreadMessages = prev.get(actualThreadId) || [];
                return new Map(prev).set(actualThreadId, [...currentThreadMessages, userMessage]);
            });

            await streamMessage(textContent, actualThreadId, fileIds);
        },
        [streamMessage, currentThreadId, setThreads, createThreadMutation, model, threads, threadMetadata, setThreadMetadata, setCurrentThreadId, navigate],
    );

    const handleEditMessage = useCallback(
        async (message: AppendMessage) => {
            if (message.content[0]?.type !== "text") {
                throw new Error("Only text messages are supported");
            }

            providerLogger.debug("[Handlers] handleEditMessage called", { parentId: message.parentId });

            const currentThreadMessages = threads.get(currentThreadId) || [];
            const index = currentThreadMessages.findIndex((m) => m.id === message.parentId) + 1;
            const newMessages = [...currentThreadMessages.slice(0, index)];

            const editedMessage: ThreadMessageLike = {
                role: "user",
                content: message.content,
                id: generateId(),
                createdAt: new Date(),
            };

            if (!isValidThreadMessage(editedMessage)) {
                providerLogger.error("[Handlers] Invalid edited message created", { editedMessage });
                return;
            }

            providerLogger.debug("[Handlers] Adding edited message", { currentThreadId, editedMessage });
            newMessages.push(editedMessage);
            setThreads((prev) => new Map(prev).set(currentThreadId, newMessages));

            await streamMessage(message.content[0].text, currentThreadId);
        },
        [threads, currentThreadId, setThreads, streamMessage],
    );

    const handleReloadMessage = useCallback(
        async (parentId: string | null) => {
            providerLogger.debug("[Handlers] handleReloadMessage called", { parentId });
            if (!parentId) {
                const currentThreadMessages = threads.get(currentThreadId);
                if (!currentThreadMessages || currentThreadMessages.length === 0) return;
                const lastUserMessage = [...currentThreadMessages].reverse().find((m) => m.role === "user");
                if (!lastUserMessage) return;

                const newMessages = [...currentThreadMessages.slice(0, currentThreadMessages.indexOf(lastUserMessage) + 1)];

                providerLogger.debug("[Handlers] Reloading from message", { parentId, lastUserMessage });
                setThreads((prev) => new Map(prev).set(currentThreadId, newMessages));

                const content = lastUserMessage.content;
                let textContent = "";
                if (Array.isArray(content)) {
                    const textPart = content.find((c) => c.type === "text");
                    if (textPart && "text" in textPart) {
                        textContent = textPart.text;
                    }
                } else if (typeof content === "string") {
                    textContent = content;
                }

                await streamMessage(textContent, currentThreadId);
            }
        },
        [threads, currentThreadId, setThreads, streamMessage],
    );

    const handleCancel = useCallback(() => {
        providerLogger.debug("[Handlers] handleCancel called");
        cancelStream();
    }, [cancelStream]);

    return {
        handleNewMessage,
        handleEditMessage,
        handleReloadMessage,
        handleCancel,
        isRunning,
    };
};
