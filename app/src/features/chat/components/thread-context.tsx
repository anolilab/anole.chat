"use client";

import type { AgentModel } from "@anole/convex/ai/lib/agents";
import { api } from "@anole/convex/api";
import type { Doc } from "@anole/convex/dataModel";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import type { ReactNode } from "react";
import { createContext, use, useMemo, useState } from "react";

type ThreadDocument = Doc<"threads">;

// Enhanced thread metadata with branching support
interface ThreadMetadata {
    branchName?: string; // Optional custom name for the branch
    branchPoint?: number; // Message index where branch was created
    createdAt: Date;
    lastActivity: Date;
    parentThreadId?: string; // For tracking branch relationships
    status: "active" | "archived";
    title: string;
}

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
    setThreadMetadata: React.Dispatch<React.SetStateAction<Map<string, ThreadMetadata>>>;
    setThreads: React.Dispatch<React.SetStateAction<Map<string, ThreadMessageLike[]>>>;

    // Branch navigation
    switchToBranch: (threadId: string) => void;
    threadMetadata: Map<string, ThreadMetadata>;
    threads: Map<string, ThreadMessageLike[]>;
}

const ThreadContext = createContext<ThreadContextType | null>(null);

export const useThreadContext = () => {
    const context = use(ThreadContext);

    if (!context) {
        throw new Error("useThreadContext must be used within ThreadProvider");
    }

    return context;
};

export const ThreadProvider = ({ children, model = "gemini-1.5-flash" }: { children: ReactNode; model?: AgentModel }) => {
    const [threads, setThreads] = useState<Map<string, ThreadMessageLike[]>>(new Map([["default", []]]));
    const [currentThreadId, setCurrentThreadId] = useState("default");
    const [threadMetadata, setThreadMetadata] = useState<Map<string, ThreadMetadata>>(new Map([]));

    // Navigation hook
    const navigate = useNavigate({ from: "/chat/$threadId" });

    // Convex hooks
    const createThreadMutation = useMutation(api.chat.functions.createThread);
    const deleteThreadMutation = useMutation(api.chat.functions.deleteThreadWithRelationships);

    // Query to get all threads for building the hierarchy
    const allThreads = useQuery(api.chat.functions.getThreads, { paginationOpts: { cursor: null, numItems: 100 } });

    // Create a new branch from a specific message in a thread
    const createBranch = async (fromThreadId: string, fromMessageIndex: number, branchName?: string): Promise<string> => {
        const sourceThread = threads.get(fromThreadId);
        const sourceMetadata = threadMetadata.get(fromThreadId);

        if (!sourceThread || !sourceMetadata) {
            throw new Error(`Thread ${fromThreadId} not found`);
        }

        if (fromMessageIndex < 0 || fromMessageIndex >= sourceThread.length) {
            throw new Error(`Invalid message index ${fromMessageIndex}`);
        }

        // Create the branch in Convex and wait for the real thread ID
        const branchId = await createThreadMutation({
            branchName,
            branchPoint: fromMessageIndex,
            model,
            parentThreadId: fromThreadId,
        });

        // Create branch metadata (messages will be merged dynamically when fetched)
        const branchMetadata: ThreadMetadata = {
            branchName,
            branchPoint: fromMessageIndex,
            createdAt: new Date(),
            lastActivity: new Date(),
            parentThreadId: fromThreadId,
            status: "active",
            title: branchName || `Branch from ${sourceMetadata.title}`,
        };

        // Update state with empty messages initially (will be merged dynamically when fetched)
        setThreads((previous) => new Map(previous).set(branchId, []));
        setThreadMetadata((previous) => new Map(previous).set(branchId, branchMetadata));

        // Automatically switch to the new branch
        setCurrentThreadId(branchId);
        navigate({ params: { threadId: branchId }, search: (previous) => { return { ...previous }; }, to: "/chat/$threadId" });

        return branchId;
    };

    // Delete a branch and all its children
    const deleteBranch = async (threadId: string) => {
        if (threadId === "default") {
            throw new Error("Cannot delete the default thread");
        }

        const childBranches = getChildBranches(threadId);

        // Recursively delete child branches
        for (const childId of childBranches) {
            await deleteBranch(childId);
        }

        // Delete from backend if session available
        try {
            await deleteThreadMutation({
                threadId,
            });
        } catch (error) {
            console.error("Failed to delete thread from backend:", error);
            // Continue with local deletion even if backend fails
        }

        // Delete the branch from local state
        setThreads((previous) => {
            const newThreads = new Map(previous);

            newThreads.delete(threadId);

            return newThreads;
        });

        setThreadMetadata((previous) => {
            const newMetadata = new Map(previous);

            newMetadata.delete(threadId);

            return newMetadata;
        });

        // Switch to parent if current thread is being deleted
        if (currentThreadId === threadId) {
            const parentId = getParentThread(threadId);

            if (parentId && parentId !== "default") {
                setCurrentThreadId(parentId);
                navigate({ params: { threadId: parentId }, search: (previous) => { return { ...previous }; }, to: "/chat/$threadId" });
            } else {
                // Redirect to main chat with notification
                navigate({
                    search: { redirectReason: "thread-deleted" },
                    to: "/chat",
                });
            }
        }
    };

    // Get parent thread ID - now uses Convex threads data
    const getParentThread = useMemo(() => (threadId: string): string | null => {
        // First check local metadata for local threads
        const localMetadata = threadMetadata.get(threadId);

        if (localMetadata?.parentThreadId) {
            return localMetadata.parentThreadId;
        }

        // Then check Convex threads data
        if (allThreads?.page) {
            const thread = allThreads.page.find((t) => (t as ThreadDocument)._id === threadId) as ThreadDocument | undefined;

            return thread?.parentThreadIds?.[0] || null;
        }

        return null;
    }, [threadMetadata, allThreads?.page]);

    // Get child branch IDs - now uses Convex threads data
    const getChildBranches = useMemo(() => (threadId: string): string[] => {
        const children: string[] = [];

        // Check local metadata first
        for (const [id, metadata] of threadMetadata.entries()) {
            if (metadata.parentThreadId === threadId) {
                children.push(id);
            }
        }

        // Then check Convex threads data
        if (allThreads?.page) {
            for (const thread of allThreads.page) {
                if (thread.parentThreadIds?.includes(threadId) && !children.includes(thread._id)) {
                    children.push(thread._id);
                }
            }
        }

        return children;
    }, [threadMetadata, allThreads?.page]);

    // Get the hierarchical tree structure of branches
    const getBranchTree = useMemo(() => (rootThreadId?: string): BranchNode[] => {
        const buildTree = (threadId: string, depth: number = 0): BranchNode => {
            // Try to get metadata from local state first
            let metadata = threadMetadata.get(threadId);

            // If not found locally, create metadata from Convex thread data
            if (!metadata && allThreads?.page) {
                const convexThread = allThreads.page.find((t) => (t as ThreadDocument)._id === threadId) as ThreadDocument | undefined;

                if (convexThread) {
                    metadata = {
                        createdAt: new Date(convexThread._creationTime),
                        lastActivity: new Date(convexThread._creationTime),
                        parentThreadId: convexThread.parentThreadIds?.[0],
                        status: convexThread.status === "active" ? "active" : "archived",
                        title: convexThread.title || "Untitled Thread",
                    };
                }
            }

            if (!metadata) {
                throw new Error(`Metadata not found for thread ${threadId}`);
            }

            const children = getChildBranches(threadId).map((childId) => buildTree(childId, depth + 1));

            return {
                children,
                depth,
                metadata,
                threadId,
            };
        };

        if (rootThreadId) {
            return [buildTree(rootThreadId)];
        }

        // Find all root threads (threads without parents)
        const rootThreads: string[] = [];

        // Check local threads
        for (const [threadId, metadata] of threadMetadata.entries()) {
            if (!metadata.parentThreadId) {
                rootThreads.push(threadId);
            }
        }

        // Check Convex threads
        if (allThreads?.page) {
            for (const thread of allThreads.page) {
                if (!thread.parentThreadIds?.length && !rootThreads.includes(thread._id)) {
                    rootThreads.push(thread._id);
                }
            }
        }

        return rootThreads.map((threadId) => buildTree(threadId));
    }, [threadMetadata, allThreads?.page, getChildBranches]);

    // Get the path from root to a specific thread
    const getThreadPath = useMemo(() => (threadId: string): string[] => {
        const path: string[] = [];
        let currentId: string | null = threadId;

        while (currentId) {
            path.unshift(currentId);
            currentId = getParentThread(currentId);
        }

        return path;
    }, [getParentThread]);

    // Get sibling branches (branches with the same parent)
    const getBranchSiblings = useMemo(() => (threadId: string): string[] => {
        const metadata = threadMetadata.get(threadId);

        if (!metadata?.parentThreadId) {
            return [];
        }

        return getChildBranches(metadata.parentThreadId).filter((id) => id !== threadId);
    }, [threadMetadata, getChildBranches]);

    // Merge a branch back into its parent or target thread
    const mergeBranch = async (sourceThreadId: string, targetThreadId: string) => {
        const sourceThread = threads.get(sourceThreadId);
        const targetThread = threads.get(targetThreadId);
        const sourceMetadata = threadMetadata.get(sourceThreadId);

        if (!sourceThread || !targetThread || !sourceMetadata) {
            throw new Error("Source or target thread not found");
        }

        // Get messages that are unique to the source branch
        const branchPoint = sourceMetadata.branchPoint || 0;
        const uniqueMessages = sourceThread.slice(branchPoint + 1);

        // Append unique messages to target thread
        setThreads((previous) => {
            const newThreads = new Map(previous);
            const updatedTarget = [...targetThread, ...uniqueMessages];

            newThreads.set(targetThreadId, updatedTarget);

            return newThreads;
        });

        // Update target thread's last activity
        setThreadMetadata((previous) => {
            const newMetadata = new Map(previous);
            const targetMeta = newMetadata.get(targetThreadId);

            if (targetMeta) {
                newMetadata.set(targetThreadId, {
                    ...targetMeta,
                    lastActivity: new Date(),
                });
            }

            return newMetadata;
        });

        // Delete the source branch
        await deleteBranch(sourceThreadId);
    };

    // Switch to a different branch
    const switchToBranch = (threadId: string) => {
        if (threads.has(threadId)) {
            setCurrentThreadId(threadId);
            navigate({ params: { threadId }, search: (previous) => { return { ...previous }; }, to: "/chat/$threadId" });

            // Update last activity
            setThreadMetadata((previous) => {
                const newMetadata = new Map(previous);
                const metadata = newMetadata.get(threadId);

                if (metadata) {
                    newMetadata.set(threadId, {
                        ...metadata,
                        lastActivity: new Date(),
                    });
                }

                return newMetadata;
            });
        }
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
                setThreadMetadata,
                setThreads,
                switchToBranch,
                threadMetadata,
                threads,
            }}
        >
            {children}
        </ThreadContext>
    );
};
