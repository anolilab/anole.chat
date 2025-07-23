import type { AgentModel } from "@anole/convex/ai/lib/agents";
import { api } from "@anole/convex/api";
import { useNavigate } from "@tanstack/react-router";
import { useAction, useMutation, usePaginatedQuery } from "convex/react";
import { useMemo } from "react";

import { useThreadContext } from "@/features/chat/components/thread-context";

interface UseThreadListAdapterProperties {
    currentThreadId: string;
    model: AgentModel;
}

const useThreadListAdapter = ({ currentThreadId, model }: UseThreadListAdapterProperties) => {
    const navigate = useNavigate();
    const threadContext = useThreadContext();

    const { setCurrentThreadId, setThreadMetadata, setThreads, threadMetadata, threads } = threadContext;

    const convexThreads = usePaginatedQuery(api.chat.functions.getThreads, {}, { initialNumItems: 10 });
    const updateThreadMutation = useAction(api.chat.functions.updateThread);
    const deleteThreadMutation = useMutation(api.chat.functions.softDeleteThread);
    const createThreadMutation = useMutation(api.chat.functions.createThread);

    return useMemo(() => {
        // Combine Convex threads with local thread metadata
        const convexThreadList: ("regular" | "archived")[] = convexThreads.results.map((t) => {
            return {
                status: t.status === "active" ? "regular" : "archived",
                threadId: t._id,
                title: t.title || "New Chat",
            };
        });

        // Add local threads that might not be in Convex yet
        const localThreadList: ("regular" | "archived")[] = [];

        for (const [threadId, metadata] of threadMetadata.entries()) {
            if (!convexThreadList.find((t) => t.threadId === threadId)) {
                localThreadList.push({
                    status: metadata.status === "active" ? "regular" : "archived",
                    threadId,
                    title: metadata.title,
                });
            }
        }

        const allThreads = [...convexThreadList, ...localThreadList];

        return {
            archivedThreads: allThreads.filter((t) => t.status === "archived") as "archived"[],
            onArchive: async (archiveThreadId) => {
                // Update local metadata immediately
                setThreadMetadata((previous) => {
                    const current = previous.get(archiveThreadId) || {
                        createdAt: new Date(),
                        lastActivity: new Date(),
                        status: "active",
                        title: "Chat",
                    };

                    return new Map(previous).set(archiveThreadId, {
                        ...current,
                        lastActivity: new Date(),
                        status: "archived",
                    });
                });

                await updateThreadMutation({
                    model,
                    status: "archived",
                    threadId: archiveThreadId,
                });
            },
            onDelete: async (deleteThreadId) => {
                // Remove from local context
                setThreads((previous) => {
                    const next = new Map(previous);

                    next.delete(deleteThreadId);

                    return next;
                });
                setThreadMetadata((previous) => {
                    const next = new Map(previous);

                    next.delete(deleteThreadId);

                    return next;
                });

                await deleteThreadMutation({
                    threadId: deleteThreadId,
                });

                // Switch to default thread if deleting current thread
                if (currentThreadId === deleteThreadId) {
                    setCurrentThreadId("default");
                    navigate({ to: "/chat" });
                }
            },

            onRename: async (renameThreadId, newTitle) => {
                setThreadMetadata((previous) => {
                    const current = previous.get(renameThreadId) || {
                        createdAt: new Date(),
                        lastActivity: new Date(),
                        status: "active",
                        title: "Chat",
                    };

                    return new Map(previous).set(renameThreadId, {
                        ...current,
                        lastActivity: new Date(),
                        title: newTitle,
                    });
                });

                await updateThreadMutation({
                    model,
                    threadId: renameThreadId,
                    title: newTitle,
                });
            },

            onSwitchToNewThread: async () => {
                console.log("Creating new thread in Convex immediately...");

                // Create the real Convex thread immediately
                const newThreadId = await createThreadMutation({
                    model,
                    title: "New Chat",
                });

                console.log("Created new thread:", newThreadId);

                // Initialize new thread in local context
                setThreads((previous) => new Map(previous).set(newThreadId, []));
                setThreadMetadata((previous) =>
                    new Map(previous).set(newThreadId, {
                        createdAt: new Date(),
                        lastActivity: new Date(),
                        status: "active",
                        title: "New Chat",
                    }),
                );
                setCurrentThreadId(newThreadId);

                // Navigate to the new thread
                navigate({ params: { threadId: newThreadId }, replace: true, search: { initialMessage: undefined }, to: "/chat/$threadId" });
            },

            onSwitchToThread: async (switchThreadId) => {
                console.log("Switching to thread:", switchThreadId);

                if (!threads.has(switchThreadId)) {
                    setThreads((previous) => new Map(previous).set(switchThreadId, []));
                }

                if (!threadMetadata.has(switchThreadId)) {
                    setThreadMetadata((previous) =>
                        new Map(previous).set(switchThreadId, {
                            createdAt: new Date(),
                            lastActivity: new Date(),
                            status: "active",
                            title: "Chat",
                        }),
                    );
                }

                setCurrentThreadId(switchThreadId);
                navigate({ params: { threadId: switchThreadId }, search: { initialMessage: undefined }, to: "/chat/$threadId" });
            },

            onUnarchive: async (unarchiveThreadId) => {
                // Update local metadata immediately
                setThreadMetadata((previous) => {
                    const current = previous.get(unarchiveThreadId) || {
                        createdAt: new Date(),
                        lastActivity: new Date(),
                        status: "archived",
                        title: "Chat",
                    };

                    return new Map(previous).set(unarchiveThreadId, {
                        ...current,
                        lastActivity: new Date(),
                        status: "active",
                    });
                });

                await updateThreadMutation({
                    model,
                    status: "active",
                    threadId: unarchiveThreadId,
                });
            },

            threadId: currentThreadId,

            threads: allThreads.filter((t) => t.status === "regular") as "regular"[],
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
        deleteThreadMutation,
        model,
        createThreadMutation,
    ]);
};

export default useThreadListAdapter;
