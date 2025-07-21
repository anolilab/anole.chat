"use client";

import { api } from "@anole/convex/api";
import type { Doc } from "@anole/convex/dataModel";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { useLingui } from "@lingui/react/macro";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import type { FC, PropsWithChildren } from "react";
import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";

import { showError } from "@/lib/toast";

import { 
    createThread, 
    deleteThread as deleteThreadFromDB, 
    getThread, 
    getAllThreads as getAllThreadsFromDB,
    updateThreadMetadata,
    type ThreadDocument,
    type ThreadMetadata 
} from "../collections/threads-collection";
import { 
    createMessage, 
    deleteMessagesByThreadId, 
    getMessagesByThreadId,
    convertToMessageDocument,
    convertToThreadMessageLike,
    type MessageDocument 
} from "../collections/messages-collection";
import { 
    useThreads, 
    useMessagesSorted, 
    useThreadWithMessages,
    useThreadHierarchy 
} from "../collections/query-collection";

type ThreadDocumentConvex = Doc<"threads">;

// Branch tree node structure for visualization
interface BranchNode {
    children: BranchNode[];
    depth: number;
    metadata: ThreadMetadata;
    threadId: string;
}

interface ThreadContextType {
    // Branching functionality
    createBranch: (fromThreadId: string, fromMessageIndex: number, branchName?: string) => Promise<string>;
    currentThreadId: string;
    deleteBranch: (threadId: string) => Promise<void>;
    getBranchSiblings: (threadId: string) => string[];
    getBranchTree: (rootThreadId?: string) => BranchNode[];
    getChildBranches: (threadId: string) => string[];
    getParentThread: (threadId: string) => string | null;
    getThreadPath: (threadId: string) => string[];
    mergeBranch: (sourceThreadId: string, targetThreadId: string) => Promise<void>;
    setCurrentThreadId: (id: string) => void;
    
    // Message management
    addMessage: (threadId: string, message: ThreadMessageLike) => void;
    updateMessage: (messageId: string, updates: Partial<MessageDocument>) => void;
    deleteMessage: (messageId: string) => void;
    getMessages: (threadId: string) => ThreadMessageLike[];
    
    // Thread management
    createNewThread: (metadata?: Partial<ThreadMetadata>) => string;
    updateThread: (threadId: string, metadata: Partial<ThreadMetadata>) => void;
    getThread: (threadId: string) => ThreadDocument | undefined;
    getAllThreads: () => ThreadDocument[];
    
    // Branch navigation
    switchToBranch: (threadId: string) => void;
    
    // Query hooks
    useThreads: () => ThreadDocument[] | undefined;
    useMessages: (threadId: string) => ThreadMessageLike[] | undefined;
    useThreadWithMessages: (threadId: string) => { thread: ThreadDocument | undefined; messages: ThreadMessageLike[] | undefined; isLoading: boolean };
    useThreadHierarchy: (rootThreadId?: string) => any[];
}

const ThreadContext = createContext<ThreadContextType | null>(null);

export const useThreadContext = () => {
    const context = use(ThreadContext);

    if (!context) {
        throw new Error("useThreadContext must be used within ThreadProvider");
    }

    return context;
};

export const ThreadProvider: FC<PropsWithChildren> = ({ children }) => {
    const { t } = useLingui();
    const [currentThreadId, setCurrentThreadId] = useState("default");
    const navigate = useNavigate({ from: "/chat/$threadId" });

    const branchThreadMutation = useMutation(api.chat.functions.branchThread);
    const deleteThreadMutation = useMutation(api.chat.functions.softDeleteThread);

    // Query to get all threads for building the hierarchy
    const allThreads = useQuery(api.chat.functions.getThreads, { paginationOpts: { cursor: null, numItems: 100 } });

    // Initialize default thread if it doesn't exist
    useEffect(() => {
        const defaultThread = getThread("default");
        if (!defaultThread) {
            createThread("default", {
                createdAt: new Date(),
                lastActivity: new Date(),
                status: "active",
                title: "New Chat",
            });
        }
    }, []);

    // Defensive: If currentThreadId is deleted or missing, auto-redirect to default or first available
    useEffect(() => {
        const localThreads = getAllThreadsFromDB();
        const backendThreadIds = allThreads?.page
            ? allThreads.page.map((t) => (typeof t._id === "string" ? t._id : undefined)).filter((id): id is string => !!id)
            : [];
        const allIds = new Set([...backendThreadIds, ...localThreads.map(t => t.id)]);

        if (!allIds.has(currentThreadId)) {
            const fallbackId = localThreads.find(t => t.id !== currentThreadId)?.id || 
                              backendThreadIds.find(id => id !== currentThreadId) || 
                              "default";

            console.warn(`[ThreadProvider] currentThreadId not found, redirecting to`, fallbackId, {
                allIds: [...allIds],
                currentThreadId,
            });

            setCurrentThreadId(fallbackId);
            navigate({
                params: { threadId: fallbackId },
                to: fallbackId === "default" ? "/chat" : "/chat/$threadId",
            });
        }
    }, [currentThreadId, allThreads, navigate]);

    // Create a new branch from a specific message in a thread
    const createBranch = async (fromThreadId: string, fromMessageIndex: number, branchName?: string): Promise<string> => {
        if (fromMessageIndex < 0) {
            throw new Error(`Invalid message index ${fromMessageIndex}`);
        }

        const branchId = await branchThreadMutation({
            branchName,
            branchPoint: fromMessageIndex,
            threadId: fromThreadId,
        });

        // Create branch metadata
        const branchMetadata: ThreadMetadata = {
            branchName,
            branchPoint: fromMessageIndex,
            createdAt: new Date(),
            lastActivity: new Date(),
            parentThreadId: fromThreadId,
            status: "active",
            title: branchName || "New Branch",
        };

        // Create the branch in local DB
        createThread(branchId, branchMetadata);

        // Automatically switch to the new branch
        setCurrentThreadId(branchId);
        navigate({
            params: { threadId: branchId },
            search: (previous) => {
                return { ...previous };
            },
            to: "/chat/$threadId",
        });

        return branchId;
    };

    // Get child branch IDs
    const getChildBranches = useMemo(
        () =>
            (threadId: string): string[] => {
                const localThreads = getAllThreadsFromDB();
                const children: string[] = [];

                // Check local threads
                for (const thread of localThreads) {
                    if (thread.metadata.parentThreadId === threadId) {
                        children.push(thread.id);
                    }
                }

                // Check Convex threads data
                if (allThreads?.page) {
                    for (const thread of allThreads.page) {
                        if ((thread as ThreadDocumentConvex).parentThreadIds?.includes(threadId) && !children.includes(thread._id)) {
                            children.push(thread._id);
                        }
                    }
                }

                return children;
            },
        [allThreads?.page],
    );

    // Get parent thread ID
    const getParentThread = useMemo(
        () =>
            (threadId: string): string | null => {
                const localThread = getThread(threadId);
                if (localThread?.metadata.parentThreadId) {
                    return localThread.metadata.parentThreadId;
                }

                // Check Convex threads data
                if (allThreads?.page) {
                    const convexThread = allThreads.page.find((t) => (t as ThreadDocumentConvex)._id === threadId) as ThreadDocumentConvex | undefined;
                    return convexThread?.parentThreadIds?.[0] || null;
                }

                return null;
            },
        [allThreads?.page],
    );

    // Delete a branch and all its children
    const deleteBranch = useCallback(
        async (threadId: string) => {
            if (threadId === "default") {
                throw new Error("Cannot delete the default thread");
            }

            // Delete messages from local DB
            deleteMessagesByThreadId(threadId);

            // Delete the thread from local DB
            deleteThreadFromDB(threadId);

            const childBranches = getChildBranches(threadId);

            try {
                for await (const childId of childBranches) {
                    await deleteBranch(childId);
                }

                // Delete from backend if session available
                await deleteThreadMutation({
                    threadId,
                });
            } catch (error) {
                console.error("Failed to delete thread:", error);
                showError(t`Failed to delete thread`);
            }

            // Switch to parent if current thread is being deleted
            if (currentThreadId === threadId) {
                const parentId = getParentThread(threadId);

                if (parentId && parentId !== "default") {
                    setCurrentThreadId(parentId);
                    await navigate({
                        params: { threadId: parentId },
                        search: (previous) => {
                            return { ...previous };
                        },
                        to: "/chat/$threadId",
                    });
                } else {
                    setCurrentThreadId("default");
                    await navigate({
                        search: { redirectReason: "thread-deleted" },
                        to: "/chat",
                    });
                }
            }
        },
        [currentThreadId, deleteThreadMutation, getChildBranches, getParentThread, navigate, t],
    );

    // Get the hierarchical tree structure of branches
    const getBranchTree = useMemo(
        () =>
            (rootThreadId?: string): BranchNode[] => {
                const localThreads = getAllThreadsFromDB();

                const buildTree = (threadId: string, depth: number = 0): BranchNode => {
                    const thread = localThreads.find(t => t.id === threadId);
                    if (!thread) {
                        throw new Error(`Thread not found: ${threadId}`);
                    }

                    const children = getChildBranches(threadId).map((childId) => buildTree(childId, depth + 1));

                    return {
                        children,
                        depth,
                        metadata: thread.metadata,
                        threadId,
                    };
                };

                if (rootThreadId) {
                    return [buildTree(rootThreadId)];
                }

                // Find all root threads (threads without parents)
                const rootThreads = localThreads.filter(t => !t.metadata.parentThreadId);
                return rootThreads.map((thread) => buildTree(thread.id));
            },
        [getChildBranches],
    );

    // Get the path from root to a specific thread
    const getThreadPath = useMemo(
        () =>
            (threadId: string): string[] => {
                const path: string[] = [];
                let currentId: string | null = threadId;

                while (currentId) {
                    path.unshift(currentId);
                    currentId = getParentThread(currentId);
                }

                return path;
            },
        [getParentThread],
    );

    // Get sibling branches (branches with the same parent)
    const getBranchSiblings = useMemo(
        () =>
            (threadId: string): string[] => {
                const thread = getThread(threadId);
                if (!thread?.metadata.parentThreadId) {
                    return [];
                }

                return getChildBranches(thread.metadata.parentThreadId).filter((id) => id !== threadId);
            },
        [getChildBranches],
    );

    // Merge a branch back into its parent or target thread
    const mergeBranch = async (sourceThreadId: string, targetThreadId: string) => {
        const sourceMessages = getMessagesByThreadId(sourceThreadId);
        const targetMessages = getMessagesByThreadId(targetThreadId);
        const sourceThread = getThread(sourceThreadId);

        if (!sourceThread) {
            throw new Error("Source thread not found");
        }

        // Get messages that are unique to the source branch
        const branchPoint = sourceThread.metadata.branchPoint || 0;
        const uniqueMessages = sourceMessages.slice(branchPoint + 1);

        // Move unique messages to target thread
        uniqueMessages.forEach(message => {
            const messageDoc = convertToMessageDocument(convertToThreadMessageLike(message), targetThreadId);
            createMessage(messageDoc);
        });

        // Delete the source branch
        await deleteBranch(sourceThreadId);
    };

    // Switch to a different branch
    const switchToBranch = (threadId: string) => {
        const thread = getThread(threadId);
        if (thread) {
            setCurrentThreadId(threadId);
            navigate({
                params: { threadId },
                search: (previous) => {
                    return { ...previous };
                },
                to: "/chat/$threadId",
            });

            // Update last activity
            updateThreadMetadata(threadId, { lastActivity: new Date() });
        }
    };

    // Message management functions
    const addMessage = (threadId: string, message: ThreadMessageLike) => {
        const messageDoc = convertToMessageDocument(message, threadId);
        createMessage(messageDoc);
        
        // Update thread's last activity
        updateThreadMetadata(threadId, { lastActivity: new Date() });
    };

    const updateMessage = (messageId: string, updates: Partial<MessageDocument>) => {
        // This would need to be implemented in the messages collection
        // For now, we'll need to add this function to the messages collection
        console.warn("updateMessage not yet implemented");
    };

    const deleteMessage = (messageId: string) => {
        // This would need to be implemented in the messages collection
        console.warn("deleteMessage not yet implemented");
    };

    const getMessages = (threadId: string): ThreadMessageLike[] => {
        const messages = getMessagesByThreadId(threadId);
        return messages.map(convertToThreadMessageLike);
    };

    // Thread management functions
    const createNewThread = (metadata?: Partial<ThreadMetadata>): string => {
        const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        createThread(threadId, {
            createdAt: new Date(),
            lastActivity: new Date(),
            status: "active",
            title: "New Chat",
            ...metadata,
        });
        return threadId;
    };

    const updateThread = (threadId: string, metadata: Partial<ThreadMetadata>) => {
        updateThreadMetadata(threadId, metadata);
    };

    const getThreadFromContext = (threadId: string) => {
        return getThread(threadId);
    };

    const getAllThreadsFromContext = () => {
        return getAllThreadsFromDB();
    };

    return (
        <ThreadContext
            value={{
                createBranch,
                currentThreadId,
                deleteBranch,
                getBranchSiblings,
                getBranchTree,
                getChildBranches,
                getParentThread,
                getThreadPath,
                mergeBranch,
                setCurrentThreadId,
                switchToBranch,
                
                // Message management
                addMessage,
                updateMessage,
                deleteMessage,
                getMessages,
                
                // Thread management
                createNewThread,
                updateThread,
                getThread: getThreadFromContext,
                getAllThreads: getAllThreadsFromContext,
                
                // Query hooks
                useThreads,
                useMessages: useMessagesSorted,
                useThreadWithMessages,
                useThreadHierarchy,
            }}
        >
            {children}
        </ThreadContext>
    );
};