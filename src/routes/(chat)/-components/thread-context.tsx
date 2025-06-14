"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@cvx/_generated/api";
import { useSession } from "@/hooks/auth-hooks";
import { useNavigate } from "@tanstack/react-router";
import type { AgentModel } from "convex/agents";

// Enhanced thread metadata with branching support
interface ThreadMetadata {
    title: string;
    status: "active" | "archived";
    parentThreadId?: string; // For tracking branch relationships
    branchPoint?: number; // Message index where branch was created
    createdAt: Date;
    lastActivity: Date;
    branchName?: string; // Optional custom name for the branch
}

// Branch tree node structure for visualization
interface BranchNode {
    threadId: string;
    metadata: ThreadMetadata;
    children: BranchNode[];
    depth: number;
}

interface ThreadContextType {
    currentThreadId: string;
    setCurrentThreadId: (id: string) => void;
    threads: Map<string, ThreadMessageLike[]>;
    setThreads: React.Dispatch<React.SetStateAction<Map<string, ThreadMessageLike[]>>>;
    threadMetadata: Map<string, ThreadMetadata>;
    setThreadMetadata: React.Dispatch<React.SetStateAction<Map<string, ThreadMetadata>>>;

    // Branching functionality
    createBranch: (fromThreadId: string, fromMessageIndex: number, branchName?: string) => Promise<string>;
    deleteBranch: (threadId: string) => Promise<void>;
    getBranchTree: (rootThreadId?: string) => BranchNode[];
    getThreadPath: (threadId: string) => string[];
    getBranchSiblings: (threadId: string) => string[];
    mergeBranch: (sourceThreadId: string, targetThreadId: string) => Promise<void>;

    // Branch navigation
    switchToBranch: (threadId: string) => void;
    getParentThread: (threadId: string) => string | null;
    getChildBranches: (threadId: string) => string[];
}

const ThreadContext = createContext<ThreadContextType | null>(null);

export const useThreadContext = () => {
    const context = useContext(ThreadContext);
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
    const sessionData = useSession();
    const createThreadMutation = useMutation(api.chat.createThread);
    const deleteThreadMutation = useMutation(api.chat.deleteThreadWithRelationships);

    // Query to get all threads for building the hierarchy
    const allThreads = useQuery(
        api.chat.getThreads,
        sessionData?.data?.session?.token ? { sessionToken: sessionData.data.session.token, paginationOpts: { numItems: 100, cursor: null } } : "skip",
    );

    // Create a new branch from a specific message in a thread
    const createBranch = async (fromThreadId: string, fromMessageIndex: number, branchName?: string): Promise<string> => {
        const sourceThread = threads.get(fromThreadId);
        console.log(sourceThread);
        const sourceMetadata = threadMetadata.get(fromThreadId);

        if (!sourceThread || !sourceMetadata) {
            throw new Error(`Thread ${fromThreadId} not found`);
        }

        if (fromMessageIndex < 0 || fromMessageIndex >= sourceThread.length) {
            throw new Error(`Invalid message index ${fromMessageIndex}`);
        }

        // Require session for branch creation - no local fallback
        if (!sessionData?.data?.session?.token) {
            throw new Error("Authentication required to create branches");
        }

        // Create the branch in Convex and wait for the real thread ID
        const branchId = await createThreadMutation({
            model,
            sessionToken: sessionData.data.session.token,
            parentThreadId: fromThreadId,
            branchPoint: fromMessageIndex,
            branchName,
        });

        // Create branch metadata (messages will be merged dynamically when fetched)
        const branchMetadata: ThreadMetadata = {
            title: branchName || `Branch from ${sourceMetadata.title}`,
            status: "active",
            parentThreadId: fromThreadId,
            branchPoint: fromMessageIndex,
            createdAt: new Date(),
            lastActivity: new Date(),
            branchName,
        };

        // Update state with empty messages initially (will be merged dynamically when fetched)
        setThreads((prev) => new Map(prev).set(branchId, []));
        setThreadMetadata((prev) => new Map(prev).set(branchId, branchMetadata));

        // Automatically switch to the new branch
        setCurrentThreadId(branchId);
        navigate({ to: "/chat/$threadId", params: { threadId: branchId } });

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
        if (sessionData?.data?.session?.token) {
            try {
                await deleteThreadMutation({
                    threadId,
                    sessionToken: sessionData.data.session.token,
                });
            } catch (error) {
                console.error("Failed to delete thread from backend:", error);
                // Continue with local deletion even if backend fails
            }
        }

        // Delete the branch from local state
        setThreads((prev) => {
            const newThreads = new Map(prev);
            newThreads.delete(threadId);
            return newThreads;
        });

        setThreadMetadata((prev) => {
            const newMetadata = new Map(prev);
            newMetadata.delete(threadId);
            return newMetadata;
        });

        // Switch to parent if current thread is being deleted
        if (currentThreadId === threadId) {
            const parentId = getParentThread(threadId);
            if (parentId && parentId !== "default") {
                setCurrentThreadId(parentId);
                navigate({ to: "/chat/$threadId", params: { threadId: parentId } });
            } else {
                // Redirect to main chat with notification
                navigate({
                    to: "/chat",
                    search: { redirectReason: "thread-deleted" },
                });
            }
        }
    };

    // Get the hierarchical tree structure of branches
    const getBranchTree = (rootThreadId?: string): BranchNode[] => {
        const buildTree = (threadId: string, depth: number = 0): BranchNode => {
            // Try to get metadata from local state first
            let metadata = threadMetadata.get(threadId);

            // If not found locally, create metadata from Convex thread data
            if (!metadata && allThreads?.page) {
                const convexThread = allThreads.page.find((t) => t._id === threadId);
                if (convexThread) {
                    metadata = {
                        title: convexThread.title || "Untitled Thread",
                        status: convexThread.status === "active" ? "active" : "archived",
                        parentThreadId: convexThread.parentThreadIds?.[0],
                        createdAt: new Date(convexThread._creationTime),
                        lastActivity: new Date(convexThread._creationTime),
                    };
                }
            }

            if (!metadata) {
                throw new Error(`Metadata not found for thread ${threadId}`);
            }

            const children = getChildBranches(threadId).map((childId) => buildTree(childId, depth + 1));

            return {
                threadId,
                metadata,
                children,
                depth,
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
    };

    // Get the path from root to a specific thread
    const getThreadPath = (threadId: string): string[] => {
        const path: string[] = [];
        let currentId: string | null = threadId;

        while (currentId) {
            path.unshift(currentId);
            currentId = getParentThread(currentId);
        }

        return path;
    };

    // Get sibling branches (branches with the same parent)
    const getBranchSiblings = (threadId: string): string[] => {
        const metadata = threadMetadata.get(threadId);
        if (!metadata?.parentThreadId) {
            return [];
        }

        return getChildBranches(metadata.parentThreadId).filter((id) => id !== threadId);
    };

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
        setThreads((prev) => {
            const newThreads = new Map(prev);
            const updatedTarget = [...targetThread, ...uniqueMessages];
            newThreads.set(targetThreadId, updatedTarget);
            return newThreads;
        });

        // Update target thread's last activity
        setThreadMetadata((prev) => {
            const newMetadata = new Map(prev);
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
            navigate({ to: "/chat/$threadId", params: { threadId } });

            // Update last activity
            setThreadMetadata((prev) => {
                const newMetadata = new Map(prev);
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

    // Get parent thread ID - now uses Convex threads data
    const getParentThread = (threadId: string): string | null => {
        // First check local metadata for local threads
        const localMetadata = threadMetadata.get(threadId);
        if (localMetadata?.parentThreadId) {
            return localMetadata.parentThreadId;
        }

        // Then check Convex threads data
        if (allThreads?.page) {
            const thread = allThreads.page.find((t) => t._id === threadId);
            return thread?.parentThreadIds?.[0] || null;
        }

        return null;
    };

    // Get child branch IDs - now uses Convex threads data
    const getChildBranches = (threadId: string): string[] => {
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
    };

    return (
        <ThreadContext.Provider
            value={{
                currentThreadId,
                setCurrentThreadId,
                threads,
                setThreads,
                threadMetadata,
                setThreadMetadata,
                createBranch,
                deleteBranch,
                getBranchTree,
                getThreadPath,
                getBranchSiblings,
                mergeBranch,
                switchToBranch,
                getParentThread,
                getChildBranches,
            }}
        >
            {children}
        </ThreadContext.Provider>
    );
};
