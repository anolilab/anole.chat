import type { AgentModel } from "@anole/convex/ai/lib/agents";
import type { ThreadMessageLike } from "@assistant-ui/react";
import type { ReactNode } from "react";

import { providerLogger } from "@/lib/logger";

// Define our message format that matches Convex agent messages
export type ConvexMessage = {
    _creationTime: number;
    _id: string;
    agentName?: string;
    embeddingId?: string;
    error?: string;
    fileIds?: string[];
    id?: string;
    message?: {
        content:
            | string
            | (
                  | {
                        text: string;
                        type: "text";
                    }
                  | {
                        image: string;
                        type: "image";
                    }
              )[];
        role: "user" | "assistant" | "system";
    };
    tool: boolean;
    userId?: string;
};

export interface ConvexExternalRuntimeProviderProperties {
    children: ReactNode;
    jwtToken: string;
    model: AgentModel;
    threadId?: string;
}

export const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Validation function to ensure a message is valid
export const isValidThreadMessage = (message: any): message is ThreadMessageLike =>
    message &&
    typeof message === "object" &&
    typeof message.id === "string" &&
    message.id.length > 0 &&
    typeof message.role === "string" &&
    (message.role === "user" || message.role === "assistant" || message.role === "system") &&
    Array.isArray(message.content) &&
    message.content.length > 0;

export const convertConvexMessage = (message: ConvexMessage): ThreadMessageLike => {
    try {
        // Handle null/undefined message entirely - create a fallback message
        if (!message?._id) {
            providerLogger.error("[Converter] Invalid message received", { message });

            return {
                content: [{ text: "Error: Invalid message data", type: "text" as const }],
                createdAt: new Date(),
                id: `error-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                role: "assistant" as const,
            };
        }

        // Create base message structure
        const baseMessage = {
            createdAt: new Date(message._creationTime),
            id: message._id,
        };

        // Handle error messages
        if (message.error) {
            providerLogger.warn("[Converter] Message is an error message", { error: message.error, id: message._id });

            return {
                ...baseMessage,
                content: [{ text: `Error: ${message.error}`, type: "text" as const }],
                role: "assistant" as const,
            };
        }

        // Handle missing message content
        if (!message.message?.role) {
            providerLogger.warn("[Converter] Message missing role or content", { id: message._id, messageData: message.message });

            return {
                ...baseMessage,
                content: [{ text: "Error: No message content", type: "text" as const }],
                role: "assistant" as const,
            };
        }

        const { role } = message.message;
        const { content } = message.message;

        let messageContent: ({ text: string; type: "text" } | { image: string; type: "image" })[] = [];

        if (typeof content === "string") {
            messageContent = [{ text: content, type: "text" }];
        } else if (Array.isArray(content)) {
            messageContent = content
                .map((part) => {
                    if (part && part.type === "text" && typeof part.text === "string") {
                        return { text: part.text, type: "text" as const };
                    }

                    if (part && part.type === "image" && typeof part.image === "string") {
                        return { image: part.image, type: "image" as const };
                    }

                    return null;
                })
                .filter((part): part is { text: string; type: "text" } | { image: string; type: "image" } => part !== null);

            // Ensure we have at least one valid content part
            if (messageContent.length === 0) {
                messageContent = [{ text: "[Invalid content]", type: "text" }];
            }
        } else {
            messageContent = [{ text: "", type: "text" }];
        }

        const convertedMessage: ThreadMessageLike = {
            ...baseMessage,
            content: messageContent,
            role,
        };

        // Final validation - if somehow invalid, create a fallback
        if (!isValidThreadMessage(convertedMessage)) {
            providerLogger.error("[Converter] Converted message failed validation", { convertedMessage });

            return {
                content: [{ text: "Error: Message validation failed", type: "text" as const }],
                createdAt: new Date(message._creationTime || Date.now()),
                id: message._id || `fallback-${Date.now()}`,
                role: "assistant" as const,
            };
        }

        return convertedMessage;
    } catch (error) {
        providerLogger.error("[Converter] Hard crash during conversion", { error, message });

        // Always return a valid fallback message
        return {
            content: [{ text: `Conversion error: ${error instanceof Error ? error.message : "Unknown error"}`, type: "text" as const }],
            createdAt: new Date(message?._creationTime || Date.now()),
            id: message?._id || `error-${Date.now()}`,
            role: "assistant" as const,
        };
    }
};
