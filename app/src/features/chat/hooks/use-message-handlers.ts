import type { AgentModel } from "@anole/convex/ai/lib/agents";
import { api } from "@anole/convex/api";
import type { AppendMessage, ThreadMessageLike } from "@assistant-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useCallback } from "react";

import { useThreadContext } from "@/features/chat/components/thread-context";
import { providerLogger } from "@/lib/logger";

import { generateId, isValidThreadMessage } from "../providers/types";
import { useStreamManager } from "./use-stream-manager";

interface UseMessageHandlersProperties {
    jwtToken: string;
    model: AgentModel;
}

export const useMessageHandlers = ({ jwtToken, model }: UseMessageHandlersProperties) => {
    const navigate = useNavigate();
    const threadContext = useThreadContext();
    const { currentThreadId, setCurrentThreadId, setThreadMetadata, setThreads, threadMetadata, threads } = threadContext;
    const createThreadMutation = useMutation(api.chat.functions.createThread);

    const onStreamStart = useCallback(
        (threadId: string, messageId: string) => {
            const assistantMessage: ThreadMessageLike = {
                content: [{ text: "", type: "text" }],
                id: messageId,
                role: "assistant",
            };

            if (!isValidThreadMessage(assistantMessage)) {
                providerLogger.error("[Handlers] Invalid optimistic assistant message created", { assistantMessage });

                return;
            }

            providerLogger.debug("[Handlers] Adding optimistic assistant message", { messageId, threadId });
            setThreads((previous) => {
                const newThreads = new Map(previous);
                const currentMessages = newThreads.get(threadId) || [];

                newThreads.set(threadId, [...currentMessages, assistantMessage]);

                return newThreads;
            });
        },
        [setThreads],
    );

    const onStreamUpdate = useCallback(
        (threadId: string, messageId: string, content: ThreadMessageLike["content"]) => {
            setThreads((previous) => {
                const newThreads = new Map(previous);
                const currentMessages = newThreads.get(threadId) || [];
                const messageIndex = currentMessages.findIndex((m) => m.id === messageId);

                if (messageIndex === -1) {
                    console.warn("Message to update not found", messageId);

                    return previous;
                }

                const updatedMessage = {
                    ...currentMessages[messageIndex],
                    content,
                };

                if (!isValidThreadMessage(updatedMessage)) {
                    console.warn("Invalid updated message:", updatedMessage);

                    return previous;
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
            providerLogger.error("[Handlers] Stream error", { error: error.message, messageId, stack: error.stack, threadId });
            onStreamUpdate(threadId, messageId, [
                {
                    text: `Error: ${error.message}`,
                    type: "text",
                },
            ]);
        },
        [onStreamUpdate],
    );

    const onStreamSuccess = useCallback((threadId: string, messageId: string) => {
        providerLogger.info("[Handlers] Stream completed successfully", { messageId, threadId });
    }, []);

    const { cancelStream, isRunning, streamMessage } = useStreamManager({
        jwtToken,
        model,
        onStreamError,
        onStreamStart,
        onStreamSuccess,
        onStreamUpdate,
    });

    const handleNewMessage = useCallback(
        async (message: AppendMessage, convexThreads: { results: any[] }) => {
            let textContent = "";
            const fileIds: string[] = [];
            const messageContent: ({ text: string; type: "text" } | { image: string; type: "image" })[] = [];

            for (const content of message.content) {
                if (content.type === "text" && content.text) {
                    textContent += content.text;
                    messageContent.push({ text: content.text, type: "text" });
                }
            }

            if (message.attachments) {
                for (const attachment of message.attachments) {
                    if (
                        attachment
                        && "metadata" in attachment
                        && attachment.metadata
                        && (attachment.metadata as any).fileId
                        && !fileIds.includes((attachment.metadata as any).fileId)
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
                        branchName: "New Chat",
                        model,
                    });

                    const currentMessages = threads.get(currentThreadId) || [];
                    const currentMetadata = threadMetadata.get(currentThreadId) || {
                        createdAt: new Date(),
                        lastActivity: new Date(),
                        status: "active" as const,
                        title: "New Chat",
                    };

                    setThreads((previous) => {
                        const next = new Map(previous);

                        next.delete(currentThreadId);
                        next.set(actualThreadId, currentMessages);

                        return next;
                    });

                    setThreadMetadata((previous) => {
                        const next = new Map(previous);

                        next.delete(currentThreadId);
                        next.set(actualThreadId, currentMetadata);

                        return next;
                    });

                    setCurrentThreadId(actualThreadId);
                    navigate({
                        params: { threadId: actualThreadId },
                        replace: true,
                        search: { initialMessage: undefined },
                        to: "/chat/$threadId",
                    });
                    providerLogger.info("[Handlers] Created new thread and navigated", { newThreadId: actualThreadId });
                } catch (error) {
                    console.error("Failed to create thread in Convex:", error);
                }
            }

            const userMessage: ThreadMessageLike = {
                attachments: message.attachments,
                content: messageContent.length > 0 ? messageContent : [{ text: textContent, type: "text" }],
                createdAt: new Date(),
                id: generateId(),
                role: "user",
            };

            if (!isValidThreadMessage(userMessage)) {
                providerLogger.error("[Handlers] Invalid user message created", { userMessage });

                return;
            }

            providerLogger.debug("[Handlers] Adding user message", { actualThreadId, userMessage });
            setThreads((previous) => {
                const currentThreadMessages = previous.get(actualThreadId) || [];

                return new Map(previous).set(actualThreadId, [...currentThreadMessages, userMessage]);
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
                content: message.content,
                createdAt: new Date(),
                id: generateId(),
                role: "user",
            };

            if (!isValidThreadMessage(editedMessage)) {
                providerLogger.error("[Handlers] Invalid edited message created", { editedMessage });

                return;
            }

            providerLogger.debug("[Handlers] Adding edited message", { currentThreadId, editedMessage });
            newMessages.push(editedMessage);
            setThreads((previous) => new Map(previous).set(currentThreadId, newMessages));

            await streamMessage(message.content[0].text, currentThreadId);
        },
        [threads, currentThreadId, setThreads, streamMessage],
    );

    const handleReloadMessage = useCallback(
        async (parentId: string | null) => {
            providerLogger.debug("[Handlers] handleReloadMessage called", { parentId });

            if (!parentId) {
                const currentThreadMessages = threads.get(currentThreadId);

                if (!currentThreadMessages || currentThreadMessages.length === 0)
                    return;

                const lastUserMessage = [...currentThreadMessages].reverse().find((m) => m.role === "user");

                if (!lastUserMessage)
                    return;

                const newMessages = [...currentThreadMessages.slice(0, currentThreadMessages.indexOf(lastUserMessage) + 1)];

                providerLogger.debug("[Handlers] Reloading from message", { lastUserMessage, parentId });
                setThreads((previous) => new Map(previous).set(currentThreadId, newMessages));

                const { content } = lastUserMessage;
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
        handleCancel,
        handleEditMessage,
        handleNewMessage,
        handleReloadMessage,
        isRunning,
    };
};
