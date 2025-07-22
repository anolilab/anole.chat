"use client";

import { useLiveQuery } from "@tanstack/react-db";
import { useMemo } from "react";

import type { MessageDocument } from "./messages-collection";
import { messagesCollection } from "./messages-collection";
import type { ThreadDocument } from "./threads-collection";
import { threadsCollection } from "./threads-collection";

// Query hooks for threads
export const useThreads = () => useLiveQuery(threadsCollection, () => threadsCollection.getAll());

export const useThread = (id: string) => useLiveQuery(threadsCollection, () => threadsCollection.get(id));

export const useThreadsByParent = (parentId: string | null) => useLiveQuery(threadsCollection, () => {
    if (parentId === null) {
        // Get root threads (no parent)
        return threadsCollection.getAll().filter((thread) => !thread.metadata.parentThreadId);
    }

    return threadsCollection.getAll().filter((thread) => thread.metadata.parentThreadId === parentId);
});

export const useActiveThreads = () => useLiveQuery(threadsCollection, () =>
    threadsCollection.getAll().filter((thread) => thread.metadata.status === "active"));

export const useArchivedThreads = () => useLiveQuery(threadsCollection, () =>
    threadsCollection.getAll().filter((thread) => thread.metadata.status === "archived"));

// Query hooks for messages
export const useMessages = (threadId: string) => useLiveQuery(messagesCollection, () =>
    messagesCollection.getAll().filter((message) => message.threadId === threadId));

export const useMessagesSorted = (threadId: string) => useLiveQuery(messagesCollection, () => {
    const messages = messagesCollection.getAll().filter((message) => message.threadId === threadId);

    return messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
});

export const useMessage = (id: string) => useLiveQuery(messagesCollection, () => messagesCollection.get(id));

export const useStreamingMessages = (threadId: string) => useLiveQuery(messagesCollection, () =>
    messagesCollection.getAll().filter((message) => message.threadId === threadId && message.isStreaming));

// Combined query hooks
export const useThreadWithMessages = (threadId: string) => {
    const thread = useThread(threadId);
    const messages = useMessagesSorted(threadId);

    return useMemo(() => {
        return {
            isLoading: thread === undefined || messages === undefined,
            messages,
            thread,
        };
    }, [thread, messages]);
};

export const useThreadHierarchy = (rootThreadId?: string) => {
    const allThreads = useThreads();

    return useMemo(() => {
        if (!allThreads)
            return [];

        const buildTree = (threadId: string, depth: number = 0): any => {
            const thread = allThreads.find((t) => t.id === threadId);

            if (!thread)
                return null;

            const children = allThreads
                .filter((t) => t.metadata.parentThreadId === threadId)
                .map((child) => buildTree(child.id, depth + 1))
                .filter(Boolean);

            return {
                children,
                depth,
                thread,
            };
        };

        if (rootThreadId) {
            return [buildTree(rootThreadId)].filter(Boolean);
        }

        // Return all root threads
        const rootThreads = allThreads.filter((t) => !t.metadata.parentThreadId);

        return rootThreads.map((thread) => buildTree(thread.id)).filter(Boolean);
    }, [allThreads, rootThreadId]);
};

// Search and filter hooks
export const useThreadsBySearch = (searchQuery: string) => {
    const allThreads = useThreads();

    return useMemo(() => {
        if (!allThreads || !searchQuery.trim())
            return allThreads || [];

        const query = searchQuery.toLowerCase();

        return allThreads.filter((thread) =>
            thread.metadata.title.toLowerCase().includes(query)
            || thread.metadata.branchName?.toLowerCase().includes(query),
        );
    }, [allThreads, searchQuery]);
};

export const useMessagesBySearch = (searchQuery: string, threadId?: string) => {
    const allMessages = useLiveQuery(messagesCollection, () => {
        if (threadId) {
            return messagesCollection.getAll().filter((m) => m.threadId === threadId);
        }

        return messagesCollection.getAll();
    });

    return useMemo(() => {
        if (!allMessages || !searchQuery.trim())
            return allMessages || [];

        const query = searchQuery.toLowerCase();

        return allMessages.filter((message) =>
            message.content.some((content) =>
                content.text.toLowerCase().includes(query),
            ),
        );
    }, [allMessages, searchQuery]);
};

// Statistics hooks
export const useThreadStats = () => {
    const allThreads = useThreads();
    const allMessages = useLiveQuery(messagesCollection, () => messagesCollection.getAll());

    return useMemo(() => {
        if (!allThreads || !allMessages)
            return null;

        const totalThreads = allThreads.length;
        const activeThreads = allThreads.filter((t) => t.metadata.status === "active").length;
        const archivedThreads = allThreads.filter((t) => t.metadata.status === "archived").length;
        const totalMessages = allMessages.length;

        const messagesPerThread = allThreads.map((thread) => {
            return {
                count: allMessages.filter((m) => m.threadId === thread.id).length,
                threadId: thread.id,
            };
        });

        const mostActiveThread = messagesPerThread.reduce((max, current) =>
            (current.count > max.count ? current : max), { count: 0, threadId: "" });

        return {
            activeThreads,
            archivedThreads,
            messagesPerThread,
            mostActiveThread,
            totalMessages,
            totalThreads,
        };
    }, [allThreads, allMessages]);
};

// Recent activity hooks
export const useRecentThreads = (limit: number = 10) => {
    const allThreads = useThreads();

    return useMemo(() => {
        if (!allThreads)
            return [];

        return allThreads
            .sort((a, b) => b.metadata.lastActivity.getTime() - a.metadata.lastActivity.getTime())
            .slice(0, limit);
    }, [allThreads, limit]);
};

export const useRecentMessages = (limit: number = 10, threadId?: string) => {
    const allMessages = useLiveQuery(messagesCollection, () => {
        if (threadId) {
            return messagesCollection.getAll().filter((m) => m.threadId === threadId);
        }

        return messagesCollection.getAll();
    });

    return useMemo(() => {
        if (!allMessages)
            return [];

        return allMessages
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
    }, [allMessages, limit, threadId]);
};
