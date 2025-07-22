import { createCollection, localOnlyCollectionOptions, localStorageCollectionOptions } from "@tanstack/react-db";
import { z } from "zod";

const isClient = globalThis.window !== undefined;

// Thread schema (matches Convex threads table + UI/UX fields, fields alphabetically ordered)
const threadSchema = z
    .object({
        createdBy: z.string().optional(),
        deleted: z.boolean().optional(),
        deletedAt: z.number().optional(),
        isPublic: z.boolean().optional(),
        model: z.string().optional(),
        order: z.number().optional(),
        pinnedAt: z.number().optional(),
        publicAccessToken: z.string().optional(),
        tags: z.array(z.string()).optional(),
        threadId: z.string(),
        title: z.string().default("New Chat"), // UI/UX field
        updatedAt: z.number().optional(),
        userId: z.string().optional(),
    })
    .strict();

// Message schema (matches Convex/ai-agent messages table, fields alphabetically ordered)
const messageSchema = z
    .object({
        agentName: z.string().optional(),
        createdAt: z.number().optional(), // for local usage, not in Convex
        embeddingId: z.string().optional(),
        error: z.string().optional(),
        fileIds: z.array(z.string()).optional(),
        finishReason: z.string().optional(),
        id: z.string().optional(),
        message: z.any().optional(), // Could be refined to match vMessage
        model: z.string().optional(),
        order: z.number().optional(),
        provider: z.string().optional(),
        providerMetadata: z.any().optional(),
        providerOptions: z.any().optional(),
        reasoning: z.string().optional(),
        reasoningDetails: z.any().optional(),
        role: z.enum(["user", "assistant", "system", "tool"]).optional(),
        sources: z.array(z.any()).optional(),
        status: z.enum(["pending", "success", "failed"]).optional(),
        stepOrder: z.number().optional(),
        text: z.string().optional(),
        threadId: z.string(),
        tool: z.boolean().optional(),
        usage: z.any().optional(),
        userId: z.string().optional(),
        warnings: z.array(z.any()).optional(),
    })
    .strict();

const THREADS_KEY = "anole-chat-threads";
const MESSAGES_KEY = "anole-chat-messages";

const threadsCollection = isClient
    ? createCollection(
        localStorageCollectionOptions({
            getKey: (item) => item.threadId,
            id: THREADS_KEY,
            schema: threadSchema,
            storage: globalThis.localStorage,
            storageKey: THREADS_KEY,
        }),
    )
    : createCollection(
        localOnlyCollectionOptions({
            getKey: (item) => item.threadId,
            id: THREADS_KEY,
            schema: threadSchema,
        }),
    );

const messagesCollection = isClient
    ? createCollection(
        localStorageCollectionOptions({
            getKey: (item) => item.id ?? "",
            id: MESSAGES_KEY,
            schema: messageSchema,
            storage: globalThis.localStorage,
            storageKey: MESSAGES_KEY,
        }),
    )
    : createCollection(
        localOnlyCollectionOptions({
            getKey: (item) => item.id ?? "",
            id: MESSAGES_KEY,
            schema: messageSchema,
        }),
    );

export type Message = z.infer<typeof messageSchema>;
export type Thread = z.infer<typeof threadSchema>;
export { messageSchema, messagesCollection, threadSchema, threadsCollection };
