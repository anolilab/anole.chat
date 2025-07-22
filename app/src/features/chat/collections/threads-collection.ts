/* eslint-disable import/exports-last */

"use client";

import { createCollection, localStorageCollectionOptions, localOnlyCollectionOptions } from "@tanstack/react-db";
import { z } from "zod/v4";

const KEY = "anole-threads";

const isClient = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

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
        messages: z.array(z.any()).default([]),
    })
    .strict();

export type ThreadDocument = z.infer<typeof threadSchema>;
export type ThreadMetadata = z.infer<typeof threadMetadataSchema>;

export const threadsCollection = isClient
  ? createCollection(
      localStorageCollectionOptions({
        getKey: (item: ThreadDocument) => item.id,
        id: KEY,
        schema: threadSchema,
        storage: window.localStorage,
        storageKey: KEY,
      })
    )
  : createCollection(
      localOnlyCollectionOptions({
        getKey: (item: ThreadDocument) => item.id,
        id: KEY,
        schema: threadSchema,
      })
    );

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
