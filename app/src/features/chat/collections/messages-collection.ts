/* eslint-disable import/exports-last */

"use client";

import type { ThreadMessageLike } from "@assistant-ui/react";
import { createCollection, localStorageCollectionOptions, localOnlyCollectionOptions } from "@tanstack/react-db";
import { z } from "zod/v4";

const KEY = "anole-messages";

const isClient = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

// Message content schema
const messageContentSchema = z
    .object({
        text: z.string(),
        type: z.literal("text"),
    })
    .strict();

// Message schema
const messageSchema = z
    .object({
        id: z.string(),
        threadId: z.string(),
        role: z.enum(["user", "assistant", "system"]),
        content: z.array(messageContentSchema),
        createdAt: z.date(),
        updatedAt: z.date().optional(),
        isStreaming: z.boolean().default(false),
        metadata: z.record(z.unknown()).optional(),
    })
    .strict();

export type MessageDocument = z.infer<typeof messageSchema>;
export type MessageContent = z.infer<typeof messageContentSchema>;

export const messagesCollection = isClient
  ? createCollection(
      localStorageCollectionOptions({
        getKey: (item: MessageDocument) => item.id,
        id: KEY,
        schema: messageSchema,
        storage: window.localStorage,
        storageKey: KEY,
      })
    )
  : createCollection(
      localOnlyCollectionOptions({
        getKey: (item: MessageDocument) => item.id,
        id: KEY,
        schema: messageSchema,
      })
    );

// Message management functions
export const createMessage = (message: Omit<MessageDocument, "createdAt">): void => {
    try {
        messagesCollection.insert({
            ...message,
            createdAt: new Date(),
        });
    } catch (error) {
        console.warn("Failed to create message:", error);
    }
};

export const updateMessage = (id: string, updates: Partial<MessageDocument>): void => {
    try {
        messagesCollection.update(id, (draft) => {
            Object.assign(draft, updates);
            draft.updatedAt = new Date();
        });
    } catch (error) {
        console.warn("Failed to update message:", error);
    }
};

export const deleteMessage = (id: string): void => {
    try {
        messagesCollection.delete(id);
    } catch (error) {
        console.warn("Failed to delete message:", error);
    }
};

export const getMessage = (id: string): MessageDocument | undefined => {
    try {
        return messagesCollection.get(id);
    } catch (error) {
        console.warn("Failed to get message:", error);
        return undefined;
    }
};

export const getMessagesByThreadId = (threadId: string): MessageDocument[] => {
    try {
        return messagesCollection.getAll().filter((message) => message.threadId === threadId);
    } catch (error) {
        console.warn("Failed to get messages by thread ID:", error);
        return [];
    }
};

export const deleteMessagesByThreadId = (threadId: string): void => {
    try {
        const messages = getMessagesByThreadId(threadId);
        messages.forEach((message) => {
            messagesCollection.delete(message.id);
        });
    } catch (error) {
        console.warn("Failed to delete messages by thread ID:", error);
    }
};

// Convert ThreadMessageLike to MessageDocument
export const convertToMessageDocument = (message: ThreadMessageLike, threadId: string): MessageDocument => {
    return {
        id: message.id,
        threadId,
        role: message.role,
        content: message.content.map((content) => ({
            text: content.type === "text" ? content.text : "",
            type: "text" as const,
        })),
        createdAt: new Date(),
        isStreaming: false,
    };
};

// Convert MessageDocument to ThreadMessageLike
export const convertToThreadMessageLike = (message: MessageDocument): ThreadMessageLike => {
    return {
        id: message.id,
        role: message.role,
        content: message.content.map((content) => ({
            text: content.text,
            type: "text" as const,
        })),
    };
};
