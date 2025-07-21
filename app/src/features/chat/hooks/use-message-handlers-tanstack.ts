"use client";

import type { AgentModel } from "@anole/convex/ai/lib/agents";
import { api } from "@anole/convex/api";
import type { AppendMessage, ThreadMessageLike } from "@assistant-ui/react";
import { useLingui } from "@lingui/react/macro";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useCallback, useMemo } from "react";

import { showError } from "@/lib/toast";

import { 
    createThread, 
    updateThreadMetadata,
    type ThreadMetadata 
} from "../collections/threads-collection";
import { 
    createMessage, 
    getMessagesByThreadId,
    convertToMessageDocument,
    convertToThreadMessageLike,
    type MessageDocument 
} from "../collections/messages-collection";
import { useThreads, useMessagesSorted } from "../collections/query-collection";

interface UseMessageHandlersProperties {
    currentThreadId: string;
    model: AgentModel;
    streamMessage: (message: AppendMessage) => void;
}

export const useMessageHandlers = ({ currentThreadId, model, streamMessage }: UseMessageHandlersProperties) => {
    const { t } = useLingui();
    const navigate = useNavigate({ from: "/chat/$threadId" });

    const createThreadMutation = useMutation(api.chat.functions.createThread);

    // Get local data using TanStack DB hooks
    const localThreads = useThreads();
    const localMessages = useMessagesSorted(currentThreadId);

    const handleNewMessage = useCallback(
        async (message: AppendMessage, convexThreads: { results: any[] }) => {
            const threadId = currentThreadId === "default" ? undefined : currentThreadId;

            if (!threadId) {
                // Create a new thread
                const newThreadId = await createThreadMutation({
                    model,
                    title: message.content[0]?.text?.slice(0, 100) || "New Chat",
                });

                // Create the thread in local DB
                createThread(newThreadId, {
                    createdAt: new Date(),
                    lastActivity: new Date(),
                    status: "active",
                    title: message.content[0]?.text?.slice(0, 100) || "New Chat",
                });

                // Add the user message to the new thread
                const userMessage: ThreadMessageLike = {
                    id: `user_${Date.now()}`,
                    role: "user",
                    content: message.content,
                };

                const messageDoc = convertToMessageDocument(userMessage, newThreadId);
                createMessage(messageDoc);

                // Update thread's last activity
                updateThreadMetadata(newThreadId, { lastActivity: new Date() });

                // Navigate to the new thread
                navigate({
                    params: { threadId: newThreadId },
                    to: "/chat/$threadId",
                });

                // Start streaming the assistant response
                streamMessage({
                    content: [{ text: "", type: "text" }],
                    role: "assistant",
                });
            } else {
                // Add message to existing thread
                const userMessage: ThreadMessageLike = {
                    id: `user_${Date.now()}`,
                    role: "user",
                    content: message.content,
                };

                const messageDoc = convertToMessageDocument(userMessage, threadId);
                createMessage(messageDoc);

                // Update thread's last activity
                updateThreadMetadata(threadId, { lastActivity: new Date() });

                // Start streaming the assistant response
                streamMessage({
                    content: [{ text: "", type: "text" }],
                    role: "assistant",
                });
            }
        },
        [currentThreadId, createThreadMutation, model, navigate, streamMessage],
    );

    const handleEditMessage = useCallback(
        (messageId: string, newContent: ThreadMessageLike["content"]) => {
            // This would need to be implemented in the messages collection
            // For now, we'll need to add this function to the messages collection
            console.warn("handleEditMessage not yet implemented");
        },
        [],
    );

    const handleReloadMessage = useCallback(
        (messageId: string) => {
            // This would need to be implemented in the messages collection
            // For now, we'll need to add this function to the messages collection
            console.warn("handleReloadMessage not yet implemented");
        },
        [],
    );

    const handleCancel = useCallback(() => {
        // Cancel streaming - this would need to be implemented
        console.warn("handleCancel not yet implemented");
    }, []);

    return {
        handleNewMessage,
        handleEditMessage,
        handleReloadMessage,
        handleCancel,
    };
};