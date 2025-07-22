/* eslint-disable import/exports-last */

"use client";

import { createCollection, localStorageCollectionOptions } from "@tanstack/react-db";
import { z } from "zod/v4";

const KEY = "anole-threads";

// Thread metadata schema
const threadMetadataSchema = z
    .object({
        branchName: z.string().optional(),
        branchPoint: z.number().optional(),
        createdAt: z.date(),
        lastActivity: z.date(),
        parentThreadId: z.string().optional(),
        status: z.enum(["active", "archived"]).default("active"),
        title: z.string(),
    })
    .strict();

// Thread document schema
const threadSchema = z
    .object({
        id: z.string(),
        metadata: threadMetadataSchema,
        messages: z.array(z.any()).default([]), // Will be typed properly when we create the messages collection
    })
    .strict();

export type ThreadDocument = z.infer<typeof threadSchema>;
export type ThreadMetadata = z.infer<typeof threadMetadataSchema>;

// Create threads collection
export const threadsCollection = createCollection(
    localStorageCollectionOptions({
        getKey: (item: ThreadDocument) => item.id,
        id: KEY,
        schema: threadSchema,
        storage: globalThis.localStorage,
        storageKey: KEY,
    }),
);

// Initialize threads collection with default thread
export const initializeThreadsCollection = (): void => {
    if (globalThis.window === undefined) {
        return;
    }

    try {
        // Check if default thread exists
        const existing = threadsCollection.get("default");
        if (!existing) {
            threadsCollection.insert({
                id: "default",
                metadata: {
                    createdAt: new Date(),
                    lastActivity: new Date(),
                    status: "active",
                    title: "New Chat",
                },
                messages: [],
            });
        }
    } catch (error) {
        console.warn("Failed to initialize threads collection:", error);
    }
};

// Thread management functions
export const createThread = (id: string, metadata: Partial<ThreadMetadata>): void => {
    try {
        threadsCollection.insert({
            id,
            metadata: {
                createdAt: new Date(),
                lastActivity: new Date(),
                status: "active",
                title: "New Chat",
                ...metadata,
            },
            messages: [],
        });
    } catch (error) {
        console.warn("Failed to create thread:", error);
    }
};

export const updateThreadMetadata = (id: string, metadata: Partial<ThreadMetadata>): void => {
    try {
        threadsCollection.update(id, (draft) => {
            Object.assign(draft.metadata, metadata);
            draft.metadata.lastActivity = new Date();
        });
    } catch (error) {
        console.warn("Failed to update thread metadata:", error);
    }
};

export const deleteThread = (id: string): void => {
    try {
        threadsCollection.delete(id);
    } catch (error) {
        console.warn("Failed to delete thread:", error);
    }
};

export const getThread = (id: string): ThreadDocument | undefined => {
    try {
        return threadsCollection.get(id);
    } catch (error) {
        console.warn("Failed to get thread:", error);
        return undefined;
    }
};

export const getAllThreads = (): ThreadDocument[] => {
    try {
        return threadsCollection.getAll();
    } catch (error) {
        console.warn("Failed to get all threads:", error);
        return [];
    }
};

// Initialize on module load
if (globalThis.window !== undefined) {
    initializeThreadsCollection();
}
