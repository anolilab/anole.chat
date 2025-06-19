import type { ThreadMessageLike } from "@assistant-ui/react";
import type { ReactNode } from "react";
import type { AgentModel } from "@cvx/ai/lib/agents";
import { providerLogger } from "@/lib/logger";

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

export interface ConvexExternalRuntimeProviderProps {
    children: ReactNode;
    model: AgentModel;
    threadId?: string;
    jwtToken: string;
}

export const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Validation function to ensure a message is valid
export const isValidThreadMessage = (message: any): message is ThreadMessageLike => {
    return (
        message &&
        typeof message === "object" &&
        typeof message.id === "string" &&
        message.id.length > 0 &&
        typeof message.role === "string" &&
        (message.role === "user" || message.role === "assistant" || message.role === "system") &&
        Array.isArray(message.content) &&
        message.content.length > 0
    );
};

export const convertConvexMessage = (message: ConvexMessage): ThreadMessageLike => {
    try {
        // Handle null/undefined message entirely - create a fallback message
        if (!message || !message._id) {
            providerLogger.error("[Converter] Invalid message received", { message });
            return {
                id: `error-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                role: "assistant" as const,
                content: [{ type: "text" as const, text: "Error: Invalid message data" }],
                createdAt: new Date(),
            };
        }

        // Create base message structure
        const baseMessage = {
            id: message._id,
            createdAt: new Date(message._creationTime),
        };

        // Handle error messages
        if (message.error) {
            providerLogger.warn("[Converter] Message is an error message", { id: message._id, error: message.error });
            return {
                ...baseMessage,
                role: "assistant" as const,
                content: [{ type: "text" as const, text: `Error: ${message.error}` }],
            };
        }

        // Handle missing message content
        if (!message.message || !message.message.role) {
            providerLogger.warn("[Converter] Message missing role or content", { id: message._id, messageData: message.message });
            return {
                ...baseMessage,
                role: "assistant" as const,
                content: [{ type: "text" as const, text: "Error: No message content" }],
            };
        }

        const role = message.message.role;
        const content = message.message.content;

        let messageContent: Array<{ type: "text"; text: string } | { type: "image"; image: string }> = [];

        if (typeof content === "string") {
            messageContent = [{ type: "text", text: content }];
        } else if (Array.isArray(content)) {
            messageContent = content
                .map((part) => {
                    if (part && part.type === "text" && typeof part.text === "string") {
                        return { type: "text" as const, text: part.text };
                    } else if (part && part.type === "image" && typeof part.image === "string") {
                        return { type: "image" as const, image: part.image };
                    }
                    return null;
                })
                .filter((part): part is { type: "text"; text: string } | { type: "image"; image: string } => part !== null);

            // Ensure we have at least one valid content part
            if (messageContent.length === 0) {
                messageContent = [{ type: "text", text: "[Invalid content]" }];
            }
        } else {
            messageContent = [{ type: "text", text: "" }];
        }

        const convertedMessage: ThreadMessageLike = {
            ...baseMessage,
            role: role,
            content: messageContent,
        };

        // Final validation - if somehow invalid, create a fallback
        if (!isValidThreadMessage(convertedMessage)) {
            providerLogger.error("[Converter] Converted message failed validation", { convertedMessage });
            return {
                id: message._id || `fallback-${Date.now()}`,
                role: "assistant" as const,
                content: [{ type: "text" as const, text: "Error: Message validation failed" }],
                createdAt: new Date(message._creationTime || Date.now()),
            };
        }

        return convertedMessage;
    } catch (error) {
        providerLogger.error("[Converter] Hard crash during conversion", { error, message });
        // Always return a valid fallback message
        return {
            id: message?._id || `error-${Date.now()}`,
            role: "assistant" as const,
            content: [{ type: "text" as const, text: `Conversion error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            createdAt: new Date(message?._creationTime || Date.now()),
        };
    }
};
