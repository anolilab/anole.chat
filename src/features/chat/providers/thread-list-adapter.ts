import { useMemo } from "react";
import type { ExternalStoreThreadData, ExternalStoreThreadListAdapter } from "@assistant-ui/react";
import { useMutation, usePaginatedQuery, useAction } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@cvx/_generated/api";
import { useThreadContext } from "@/features/chat/components/thread-context";
import type { AgentModel } from "@cvx/ai/lib/agents";

interface UseThreadListAdapterProps {
    model: AgentModel;
    currentThreadId: string;
}

export const useThreadListAdapter = ({ model, currentThreadId }: UseThreadListAdapterProps): ExternalStoreThreadListAdapter => {
    const navigate = useNavigate();
    const threadContext = useThreadContext();

    const { setCurrentThreadId, threads, setThreads, threadMetadata, setThreadMetadata } = threadContext;

    const convexThreads = usePaginatedQuery(api.chat.functions.getThreads, {}, { initialNumItems: 10 });
    const updateThreadMutation = useAction(api.chat.functions.updateThread);
    const deleteThread = useMutation(api.chat.functions.deleteThreadWithRelationships);
    const createThreadMutation = useMutation(api.chat.functions.createThread);

    return useMemo(() => {
        // Combine Convex threads with local thread metadata
        const convexThreadList: ExternalStoreThreadData<"regular" | "archived">[] = convexThreads.results.map((t) => ({
            threadId: t._id,
            status: t.status === "active" ? "regular" : "archived",
            title: t.title || "New Chat",
        }));

        // Add local threads that might not be in Convex yet
        const localThreadList: ExternalStoreThreadData<"regular" | "archived">[] = [];

        for (const [threadId, metadata] of threadMetadata.entries()) {
            if (!convexThreadList.find((t) => t.threadId === threadId)) {
                localThreadList.push({
                    threadId,
                    status: metadata.status === "active" ? "regular" : "archived",
                    title: metadata.title,
                });
            }
        }

        const allThreads = [...convexThreadList, ...localThreadList];

        return {
            threadId: currentThreadId,
            threads: allThreads.filter((t) => t.status === "regular") as ExternalStoreThreadData<"regular">[],
            archivedThreads: allThreads.filter((t) => t.status === "archived") as ExternalStoreThreadData<"archived">[],

            onSwitchToNewThread: async () => {
                console.log("Creating new thread in Convex immediately...");

                // Create the real Convex thread immediately
                const newThreadId = await createThreadMutation({
                    model,
                    branchName: "New Chat",
                });

                console.log("Created new thread:", newThreadId);

                // Initialize new thread in local context
                setThreads((prev) => new Map(prev).set(newThreadId, []));
                setThreadMetadata((prev) =>
                    new Map(prev).set(newThreadId, {
                        title: "New Chat",
                        status: "active",
                        createdAt: new Date(),
                        lastActivity: new Date(),
                    }),
                );
                setCurrentThreadId(newThreadId);

                // Navigate to the new thread
                navigate({ to: "/chat/$threadId", params: { threadId: newThreadId }, replace: true, search: { initialMessage: undefined } });
            },

            onSwitchToThread: async (switchThreadId) => {
                console.log("Switching to thread:", switchThreadId);

                if (!threads.has(switchThreadId)) {
                    setThreads((prev) => new Map(prev).set(switchThreadId, []));
                }

                if (!threadMetadata.has(switchThreadId)) {
                    setThreadMetadata((prev) =>
                        new Map(prev).set(switchThreadId, {
                            title: "Chat",
                            status: "active",
                            createdAt: new Date(),
                            lastActivity: new Date(),
                        }),
                    );
                }

                setCurrentThreadId(switchThreadId);
                navigate({ to: "/chat/$threadId", params: { threadId: switchThreadId }, search: { initialMessage: undefined } });
            },

            onRename: async (renameThreadId, newTitle) => {
                setThreadMetadata((prev) => {
                    const current = prev.get(renameThreadId) || {
                        title: "Chat",
                        status: "active",
                        createdAt: new Date(),
                        lastActivity: new Date(),
                    };

                    return new Map(prev).set(renameThreadId, {
                        ...current,
                        title: newTitle,
                        lastActivity: new Date(),
                    });
                });

                await updateThreadMutation({
                    threadId: renameThreadId,
                    title: newTitle,
                    model,
                });
            },

            onArchive: async (archiveThreadId) => {
                // Update local metadata immediately
                setThreadMetadata((prev) => {
                    const current = prev.get(archiveThreadId) || {
                        title: "Chat",
                        status: "active",
                        createdAt: new Date(),
                        lastActivity: new Date(),
                    };
                    return new Map(prev).set(archiveThreadId, {
                        ...current,
                        status: "archived",
                        lastActivity: new Date(),
                    });
                });

                await updateThreadMutation({
                    threadId: archiveThreadId,
                    status: "archived",
                    model,
                });
            },

            onUnarchive: async (unarchiveThreadId) => {
                // Update local metadata immediately
                setThreadMetadata((prev) => {
                    const current = prev.get(unarchiveThreadId) || {
                        title: "Chat",
                        status: "archived",
                        createdAt: new Date(),
                        lastActivity: new Date(),
                    };
                    return new Map(prev).set(unarchiveThreadId, {
                        ...current,
                        status: "active",
                        lastActivity: new Date(),
                    });
                });

                await updateThreadMutation({
                    threadId: unarchiveThreadId,
                    status: "active",
                    model,
                });
            },

            onDelete: async (deleteThreadId) => {
                // Remove from local context
                setThreads((prev) => {
                    const next = new Map(prev);
                    next.delete(deleteThreadId);
                    return next;
                });
                setThreadMetadata((prev) => {
                    const next = new Map(prev);
                    next.delete(deleteThreadId);
                    return next;
                });

                // Switch to default thread if deleting current thread
                if (currentThreadId === deleteThreadId) {
                    setCurrentThreadId("default");
                    navigate({ to: "/chat" });
                }

                await deleteThread({
                    threadId: deleteThreadId,
                });
            },
        };
    }, [
        convexThreads.results,
        currentThreadId,
        threadMetadata,
        threads,
        setCurrentThreadId,
        setThreads,
        setThreadMetadata,
        navigate,
        updateThreadMutation,
        deleteThread,
        model,
        createThreadMutation,
    ]);
};
