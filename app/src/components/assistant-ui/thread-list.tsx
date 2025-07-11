import { api } from "@anole/convex/api";
import type { Doc } from "@anole/convex/dataModel";
import { ThreadListPrimitive } from "@assistant-ui/react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLingui } from "@lingui/react/macro";
import { useNavigate } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAction, useConvex, useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import {
    ArchiveIcon,
    ChevronDown,
    ChevronRight,
    DownloadIcon,
    GitBranch,
    GripVertical,
    HelpCircle,
    Loader2,
    Pin,
    PinOff,
    PlusIcon,
    Search,
    TrashIcon,
    X,
} from "lucide-react";
import type { FC, JSX } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { KeyCombo, Keys, KeySymbol, ShortcutsProvider } from "@/components/ui/keyboard-shortcuts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useThreadContext } from "@/features/chat/components/thread-context";
import type { DownloadFormat } from "@/lib/download";
import { handleDownload } from "@/lib/download";
import { ValidationError } from "@/lib/errors";
import { cn } from "@/lib/utils";

// Type definitions for thread hierarchy
interface BranchNode {
    branchPoint: number;
    branchType: string;
    children: BranchNode[];
    createdAt: number;
    depth: number;
    isPinned?: boolean;
    model?: string;
    order?: number;
    relevantMessages?: any[]; // Messages that matched the search query
    status: string;
    threadId: string;
    title: string;
}

interface ThreadGroup {
    isCollapsed?: boolean;
    threads: BranchNode[];
    title: string;
}

type GroupType = "pinned" | "today" | "last7days" | "lastMonth" | "older" | "archived";

export const ThreadList: FC = () => {
    const { t } = useLingui();
    const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
    const [collapsedGroups, setCollapsedGroups] = useState<Set<GroupType>>(new Set());
    const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [searchType, setSearchType] = useState<"threads" | "messages">("threads");
    const [loadingStates, setLoadingStates] = useState<{
        archiving: Set<string>;
        branching: Set<string>;
        deleting: Set<string>;
        downloading: Set<string>;
        pinning: Set<string>;
        reordering: boolean;
    }>({
        archiving: new Set(),
        branching: new Set(),
        deleting: new Set(),
        downloading: new Set(),
        pinning: new Set(),
        reordering: false,
    });

    // Search threads when there's a search query and search type is "threads"
    const threadSearchResults = useQuery(
        api.chat.functions.searchThreads,
        searchType === "threads"
            ? {
                paginationOpts: { cursor: null, numItems: 100 },
                searchQuery: searchQuery.trim(),
            }
            : "skip",
    );

    // Search messages when there's a search query and search type is "messages"
    const messageSearchResults = useQuery(
        api.chat.functions.searchMessages,
        searchType === "messages"
            ? {
                paginationOpts: { cursor: null, numItems: 100 },
                searchQuery: searchQuery.trim(),
            }
            : "skip",
    );

    // Check if search is loading
    const isSearchLoading = searchQuery.trim() && ((searchType === "threads" && !threadSearchResults) || (searchType === "messages" && !messageSearchResults));

    const toggleExpanded = (threadId: string) => {
        setExpandedThreads((previous) => {
            const next = new Set(previous);

            if (next.has(threadId)) {
                next.delete(threadId);
            } else {
                next.add(threadId);
            }

            return next;
        });
    };

    const toggleGroupCollapsed = (groupType: GroupType) => {
        setCollapsedGroups((previous) => {
            const next = new Set(previous);

            if (next.has(groupType)) {
                next.delete(groupType);
            } else {
                next.add(groupType);
            }

            return next;
        });
    };

    return (
        <ThreadListPrimitive.Root className="flex flex-col items-stretch gap-1.5 pl-2 text-white">
            <div className="flex w-full items-center gap-2">
                <ThreadListNew />
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                className="h-8 w-8 p-0 text-white hover:bg-white/10 hover:text-white"
                                onClick={() => setShowSearch(!showSearch)}
                                size="sm"
                                variant="icon"
                            >
                                <Search className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t`Search threads (Ctrl+F)`}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                className="h-8 w-8 p-0 text-white hover:bg-white/10 hover:text-white"
                                onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                                size="sm"
                                variant="icon"
                            >
                                <HelpCircle className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t`Keyboard shortcuts (?)`}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            {showSearch && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Button
                            className="border-white/20 text-xs text-white hover:bg-white/10 data-[active]:bg-white/20"
                            onClick={() => setSearchType("threads")}
                            size="sm"
                            variant={searchType === "threads" ? "default" : "outline"}
                        >
                            {t`Threads`}
                        </Button>
                        <Button
                            className="border-white/20 text-xs text-white hover:bg-white/10 data-[active]:bg-white/20"
                            onClick={() => setSearchType("messages")}
                            size="sm"
                            variant={searchType === "messages" ? "default" : "outline"}
                        >
                            {t`Messages`}
                        </Button>
                    </div>
                    <div className="relative">
                        <Input
                            autoFocus
                            className="border-white/20 bg-white/5 pr-8 text-white placeholder:text-white/60"
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={searchType === "threads" ? t`Search thread titles...` : t`Search message content...`}
                            value={searchQuery}
                        />
                        {searchQuery && (
                            <Button
                                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                                onClick={() => setSearchQuery("")}
                                size="sm"
                                variant="icon"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                        {isSearchLoading && (
                            <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            )}
            <HierarchicalThreadList
                collapsedGroups={collapsedGroups}
                expandedThreads={expandedThreads}
                isSearchLoading={isSearchLoading}
                loadingStates={loadingStates}
                messageSearchResults={messageSearchResults}
                searchQuery={searchQuery}
                searchType={searchType}
                setLoadingStates={setLoadingStates}
                setShowKeyboardHelp={setShowKeyboardHelp}
                setShowSearch={setShowSearch}
                showKeyboardHelp={showKeyboardHelp}
                threadSearchResults={threadSearchResults}
                toggleExpanded={toggleExpanded}
                toggleGroupCollapsed={toggleGroupCollapsed}
            />
        </ThreadListPrimitive.Root>
    );
};

const ThreadListNew: FC = () => {
    const { t } = useLingui();

    return (
        <ThreadListPrimitive.New asChild>
            <Button
                className="flex grow items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start text-white hover:bg-white/10 data-[active]:bg-white/20"
                variant="icon"
            >
                <PlusIcon />
                {t`New Thread`}
            </Button>
        </ThreadListPrimitive.New>
    );
};

// Unified hierarchical thread list that shows parent-child relationships
interface HierarchicalThreadListProperties {
    collapsedGroups: Set<GroupType>;
    expandedThreads: Set<string>;
    isSearchLoading: boolean;
    loadingStates: {
        archiving: Set<string>;
        branching: Set<string>;
        deleting: Set<string>;
        downloading: Set<string>;
        pinning: Set<string>;
        reordering: boolean;
    };
    messageSearchResults: any;
    searchQuery: string;
    searchType: "threads" | "messages";
    setLoadingStates: React.Dispatch<
        React.SetStateAction<{
            archiving: Set<string>;
            branching: Set<string>;
            deleting: Set<string>;
            downloading: Set<string>;
            pinning: Set<string>;
            reordering: boolean;
        }>
    >;
    setShowKeyboardHelp: React.Dispatch<React.SetStateAction<boolean>>;
    setShowSearch: React.Dispatch<React.SetStateAction<boolean>>;
    showKeyboardHelp: boolean;
    threadSearchResults: any;
    toggleExpanded: (threadId: string) => void;
    toggleGroupCollapsed: (groupType: GroupType) => void;
}

const HierarchicalThreadList: FC<HierarchicalThreadListProperties> = ({
    collapsedGroups,
    expandedThreads,
    isSearchLoading,
    loadingStates,
    messageSearchResults,
    searchQuery,
    searchType,
    setLoadingStates,
    setShowKeyboardHelp,
    setShowSearch,
    showKeyboardHelp,
    threadSearchResults,
    toggleExpanded,
    toggleGroupCollapsed,
}) => {
    const { t } = useLingui();
    const { createBranch, currentThreadId, deleteBranch, threads } = useThreadContext();
    const navigate = useNavigate();
    const convex = useConvex();

    // Keyboard navigation state
    const [selectedThreadIndex, setSelectedThreadIndex] = useState<number>(-1);
    const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);

    // Get all threads to build the hierarchy
    const threadsData = useQuery(api.chat.functions.getThreads, { paginationOpts: { cursor: null, numItems: 100 } });

    // Get thread relationships to build hierarchy
    const threadRelationships = useQuery(api.chat.functions.getAllThreadRelationships);

    // Get pinned threads
    const pinnedThreads = useQuery(api.chat.functions.getPinnedThreads);

    // Get thread orders
    const threadOrders = useQuery(api.chat.functions.getThreadOrders);

    // Pin/unpin mutations
    const pinThreadMutation = useMutation(api.chat.functions.pinThread);
    const unpinThreadMutation = useMutation(api.chat.functions.unpinThread);

    const updateThreadAction = useAction(api.chat.functions.updateThread);

    // Thread order mutation
    const updateThreadOrderMutation = useMutation(api.chat.functions.updateThreadOrder);

    // Group threads by time periods
    const threadGroups = useMemo(() => {
        // Determine which threads to use based on search type
        let threadsToUse;

        if (searchQuery.trim()) {
            if (searchType === "threads") {
                threadsToUse = threadSearchResults?.page;
            } else if (searchType === "messages") {
                threadsToUse = messageSearchResults?.page;
            }
        } else {
            threadsToUse = threadsData?.page;
        }

        if (!threadsToUse || !threadRelationships)
            return [];

        // Create maps for quick lookups
        const threadMap = new Map(threadsToUse.map((thread: any) => [thread._id, thread]));
        const relationshipMap = new Map(threadRelationships.map((rel: any) => [rel.threadId, rel]));
        const pinnedThreadsSet = new Set(pinnedThreads?.map((pin: any) => pin.threadId) || []);
        const threadOrderMap = new Map(threadOrders?.map((order: any) => [order.threadId, order.order]) || []);

        // Find root threads (threads without parent relationships)
        const rootThreads = threadsToUse.filter((thread: any) => !relationshipMap.has(thread._id));

        const buildHierarchy = (threadId: string, depth: number = 0): BranchNode | null => {
            const thread = threadMap.get(threadId);

            if (!thread)
                return null;

            // Find direct children using relationships
            const childRelationships = threadRelationships.filter((rel: any) => rel.parentThreadId === threadId);
            const children = childRelationships.map((rel: any) => buildHierarchy(rel.threadId, depth + 1)).filter((node): node is BranchNode => node !== null);

            return {
                branchPoint: relationshipMap.get(threadId)?.branchPoint || 0,
                branchType: relationshipMap.get(threadId)?.branchType || "branch",
                children,
                createdAt: thread._creationTime,
                depth,
                isPinned: pinnedThreadsSet.has(threadId),
                model: thread.model,
                order: threadOrderMap.get(threadId),
                // Add search relevance info if available (for message search)
                relevantMessages: thread.relevantMessages,
                status: thread.status || "active",
                threadId: thread._id,
                title: thread.title || "New Chat",
            };
        };

        const allThreads = rootThreads.map((thread: any) => buildHierarchy(thread._id)).filter((node): node is BranchNode => node !== null);

        // If searching, return all threads in a single group
        if (searchQuery.trim()) {
            const sortedThreads = allThreads.sort((a, b) => {
                // If we have message search results, sort by relevance first
                if (searchType === "messages" && messageSearchResults?.page) {
                    const aRelevance = a.relevantMessages?.length || 0;
                    const bRelevance = b.relevantMessages?.length || 0;

                    if (aRelevance !== bRelevance) {
                        return bRelevance - aRelevance; // More relevant first
                    }
                }

                // Normal sorting: pinned threads first, then by custom order, then by newest first
                if (a.isPinned && !b.isPinned)
                    return -1;

                if (!a.isPinned && b.isPinned)
                    return 1;

                // Within pinned/unpinned groups, sort by custom order if available
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                }

                if (a.order !== undefined && b.order === undefined)
                    return -1;

                if (a.order === undefined && b.order !== undefined)
                    return 1;

                // Finally, sort by creation time (newest first)
                return b.createdAt - a.createdAt;
            });

            return [
                {
                    isCollapsed: false,
                    threads: sortedThreads,
                    title: `Search Results (${sortedThreads.length})`,
                },
            ];
        }

        // Group threads by time periods, excluding archived threads
        const now = Date.now();
        const startOfToday = new Date();

        startOfToday.setHours(0, 0, 0, 0);
        const todayTimestamp = startOfToday.getTime();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

        const pinnedThreadsList: BranchNode[] = [];
        const todayThreads: BranchNode[] = [];
        const last7DaysThreads: BranchNode[] = [];
        const lastMonthThreads: BranchNode[] = [];
        const olderThreads: BranchNode[] = [];
        const archivedThreads: BranchNode[] = [];

        allThreads.forEach((thread: BranchNode) => {
            // Separate archived threads into their own group
            if (thread.status === "archived") {
                archivedThreads.push(thread);
            } else if (thread.isPinned) {
                pinnedThreadsList.push(thread);
            } else if (thread.createdAt >= todayTimestamp) {
                todayThreads.push(thread);
            } else if (thread.createdAt >= sevenDaysAgo) {
                last7DaysThreads.push(thread);
            } else if (thread.createdAt >= thirtyDaysAgo) {
                lastMonthThreads.push(thread);
            } else {
                olderThreads.push(thread);
            }
        });

        // Sort each group
        const sortThreads = (threads: BranchNode[]) => threads.sort((a: BranchNode, b: BranchNode) => {
            // Within groups, sort by custom order if available, then by newest first
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }

            if (a.order !== undefined && b.order === undefined)
                return -1;

            if (a.order === undefined && b.order !== undefined)
                return 1;

            return b.createdAt - a.createdAt;
        });

        const groups: ThreadGroup[] = [];

        if (pinnedThreadsList.length > 0) {
            groups.push({
                isCollapsed: collapsedGroups.has("pinned"),
                threads: sortThreads(pinnedThreadsList),
                title: "Pinned",
            });
        }

        if (todayThreads.length > 0) {
            groups.push({
                isCollapsed: collapsedGroups.has("today"),
                threads: sortThreads(todayThreads),
                title: "Today",
            });
        }

        if (last7DaysThreads.length > 0) {
            groups.push({
                isCollapsed: collapsedGroups.has("last7days"),
                threads: sortThreads(last7DaysThreads),
                title: "Last 7 days",
            });
        }

        if (lastMonthThreads.length > 0) {
            groups.push({
                isCollapsed: collapsedGroups.has("lastMonth"),
                threads: sortThreads(lastMonthThreads),
                title: "Last month",
            });
        }

        if (olderThreads.length > 0) {
            groups.push({
                isCollapsed: collapsedGroups.has("older"),
                threads: sortThreads(olderThreads),
                title: "Older",
            });
        }

        // Always add archived threads as the last group
        if (archivedThreads.length > 0) {
            groups.push({
                isCollapsed: collapsedGroups.has("archived"),
                threads: sortThreads(archivedThreads),
                title: "Archived",
            });
        }

        return groups;
    }, [
        threadsData?.page,
        threadSearchResults?.page,
        messageSearchResults?.page,
        threadRelationships,
        pinnedThreads,
        threadOrders,
        searchQuery,
        searchType,
        collapsedGroups,
    ]);

    // Flatten threads for keyboard navigation
    const flattenedThreads = useMemo(() => {
        const flattened: BranchNode[] = [];

        const flattenNode = (node: BranchNode) => {
            flattened.push(node);

            if (expandedThreads.has(node.threadId)) {
                node.children.forEach(flattenNode);
            }
        };

        threadGroups.forEach((group) => {
            if (!group.isCollapsed) {
                group.threads.forEach(flattenNode);
            }
        });

        return flattened;
    }, [threadGroups, expandedThreads]);

    const handleDownloadThread = useCallback(
        async (node: BranchNode, format: DownloadFormat) => {
            if (!node.model) {
                throw new ValidationError("Cannot download thread: Model information is missing", "model", ["required"], {
                    context: {
                        threadId: node.threadId,
                        threadTitle: node.title,
                    },
                });
            }

            setLoadingStates((previous) => {
                return {
                    ...previous,
                    downloading: new Set(previous.downloading).add(node.threadId),
                };
            });

            try {
                const data = await convex.query(api.chat.functions.getFullThreadForExport, {
                    model: node.model,

                    threadId: node.threadId,
                });

                if (data && data.thread && data.messages) {
                    handleDownload(data.thread, data.messages as Doc<"messages">[], format);
                }
            } catch (error) {
                console.error("Failed to download thread:", error);
            } finally {
                setLoadingStates((previous) => {
                    const newDownloading = new Set(previous.downloading);

                    newDownloading.delete(node.threadId);

                    return { ...previous, downloading: newDownloading };
                });
            }
        },
        [convex, setLoadingStates],
    );

    const handleCreateBranch = async (threadId: string) => {
        setLoadingStates((previous) => {
            return {
                ...previous,
                branching: new Set(previous.branching).add(threadId),
            };
        });

        try {
            const currentMessages = threads.get(threadId) || [];

            if (currentMessages.length > 0) {
                await createBranch(threadId, currentMessages.length - 1, "New Branch");
            }
        } catch (error) {
            console.error("Failed to create branch:", error);
        } finally {
            setLoadingStates((previous) => {
                const newBranching = new Set(previous.branching);

                newBranching.delete(threadId);

                return {
                    ...previous,
                    branching: newBranching,
                };
            });
        }
    };

    const handleDeleteThread = async (threadId: string) => {
        setLoadingStates((previous) => {
            return {
                ...previous,
                deleting: new Set(previous.deleting).add(threadId),
            };
        });

        try {
            await deleteBranch(threadId);
        } catch (error) {
            console.error("Failed to delete thread:", error);
        } finally {
            setLoadingStates((previous) => {
                const newDeleting = new Set(previous.deleting);

                newDeleting.delete(threadId);

                return {
                    ...previous,
                    deleting: newDeleting,
                };
            });
        }
    };

    const handlePinThread = async (threadId: string) => {
        setLoadingStates((previous) => {
            return {
                ...previous,
                pinning: new Set(previous.pinning).add(threadId),
            };
        });

        try {
            await pinThreadMutation({
                threadId,
            });
        } catch (error) {
            console.error("Failed to pin thread:", error);
        } finally {
            setLoadingStates((previous) => {
                const newPinning = new Set(previous.pinning);

                newPinning.delete(threadId);

                return {
                    ...previous,
                    pinning: newPinning,
                };
            });
        }
    };

    const handleUnpinThread = async (threadId: string) => {
        setLoadingStates((previous) => {
            return {
                ...previous,
                pinning: new Set(previous.pinning).add(threadId),
            };
        });

        try {
            await unpinThreadMutation({
                threadId,
            });
        } catch (error) {
            console.error("Failed to unpin thread:", error);
        } finally {
            setLoadingStates((previous) => {
                const newPinning = new Set(previous.pinning);

                newPinning.delete(threadId);

                return {
                    ...previous,
                    pinning: newPinning,
                };
            });
        }
    };

    const updateThread = async (threadId: string, model: string, status: "archived" | "active") => {
        setLoadingStates((previous) => {
            return {
                ...previous,
                archiving: new Set(previous.archiving).add(threadId),
            };
        });

        try {
            await updateThreadAction({
                model,
                status,
                threadId,
            });
        } catch (error) {
            console.error(`Failed to ${status === "archived" ? "archive" : "unarchive"} thread:`, error);
        } finally {
            setLoadingStates((previous) => {
                const newArchiving = new Set(previous.archiving);

                newArchiving.delete(threadId);

                return {
                    ...previous,
                    archiving: newArchiving,
                };
            });
        }
    };

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // Handle drag end - implement thread reordering
    const handleDragEnd = async (event: any) => {
        const { active, over } = event;

        if (!over || active.id === over.id)
            return;

        setLoadingStates((previous) => { return { ...previous, reordering: true }; });

        try {
            // Find which group the active and over items belong to
            let activeGroup: ThreadGroup | null = null;
            let overGroup: ThreadGroup | null = null;
            let activeIndex = -1;
            let overIndex = -1;

            for (const group of threadGroups) {
                const activeThreadIndex = group.threads.findIndex((t) => t.threadId === active.id);
                const overThreadIndex = group.threads.findIndex((t) => t.threadId === over.id);

                if (activeThreadIndex !== -1) {
                    activeGroup = group;
                    activeIndex = activeThreadIndex;
                }

                if (overThreadIndex !== -1) {
                    overGroup = group;
                    overIndex = overThreadIndex;
                }
            }

            // Only allow reordering within the same group for now
            if (!activeGroup || !overGroup || activeGroup.title !== overGroup.title) {
                console.log("Cross-group reordering not supported yet");

                return;
            }

            // Reorder threads within the group
            const reorderedThreads = arrayMove(activeGroup.threads, activeIndex, overIndex);

            // Update the order in the database
            const threadOrders = reorderedThreads.map((thread, index) => {
                return {
                    order: index,
                    threadId: thread.threadId,
                };
            });

            await updateThreadOrderMutation({
                threadOrders,
            });
        } catch (error) {
            console.error("Failed to reorder threads:", error);
        } finally {
            setLoadingStates((previous) => { return { ...previous, reordering: false }; });
        }
    };

    // Keyboard shortcuts handlers
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            const isCtrlOrCmd = event.ctrlKey || event.metaKey;

            // Don't handle shortcuts if user is typing in an input
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (event.key) {
                case "?": {
                    if (!isCtrlOrCmd) {
                        event.preventDefault();
                        setShowKeyboardHelp((previous) => !previous);
                    }

                    break;
                }
                case "a":

                case "A": {
                    if (isCtrlOrCmd && currentThreadId) {
                        event.preventDefault();
                        const currentThread = flattenedThreads.find((t) => t.threadId === currentThreadId);

                        if (currentThread) {
                            const model = currentThread.model || "gemini-1.5-flash"; // Default model

                            if (currentThread.status === "archived") {
                                updateThread(currentThreadId, model, "active");
                            } else {
                                updateThread(currentThreadId, model, "archived");
                            }
                        }
                    }

                    break;
                }
                case "ArrowDown": {
                    if (!isCtrlOrCmd) {
                        event.preventDefault();
                        setIsKeyboardNavigating(true);
                        setSelectedThreadIndex((previous) => {
                            const totalThreads = flattenedThreads.length;
                            const newIndex = previous >= totalThreads - 1 ? 0 : previous + 1;

                            return newIndex;
                        });
                    }

                    break;
                }

                case "ArrowUp": {
                    if (!isCtrlOrCmd) {
                        event.preventDefault();
                        setIsKeyboardNavigating(true);
                        setSelectedThreadIndex((previous) => {
                            const totalThreads = flattenedThreads.length;
                            const newIndex = previous <= 0 ? totalThreads - 1 : previous - 1;

                            return newIndex;
                        });
                    }

                    break;
                }
                case "b":

                case "B": {
                    if (isCtrlOrCmd && currentThreadId) {
                        event.preventDefault();
                        handleCreateBranch(currentThreadId);
                    }

                    break;
                }
                case "d":

                case "D": {
                    if (isCtrlOrCmd && currentThreadId) {
                        event.preventDefault();
                        handleDeleteThread(currentThreadId);
                    }

                    break;
                }
                case "Enter": {
                    if (isKeyboardNavigating && selectedThreadIndex >= 0 && selectedThreadIndex < flattenedThreads.length) {
                        event.preventDefault();
                        const selectedThread = flattenedThreads[selectedThreadIndex];

                        navigate({ params: { threadId: selectedThread.threadId }, search: { initialMessage: undefined }, to: "/chat/$threadId" });
                        setIsKeyboardNavigating(false);
                        setSelectedThreadIndex(-1);
                    }

                    break;
                }

                case "Escape": {
                    event.preventDefault();
                    setIsKeyboardNavigating(false);
                    setSelectedThreadIndex(-1);
                    setShowKeyboardHelp(false);
                    break;
                }

                case "f":

                case "F": {
                    if (isCtrlOrCmd) {
                        event.preventDefault();
                        setShowSearch((previous) => !previous);
                    }

                    break;
                }

                case "n":

                case "N": {
                    if (isCtrlOrCmd) {
                        event.preventDefault();
                        // Create new thread
                        navigate({ to: "/chat/new" });
                    }

                    break;
                }

                case "p":
                case "P": {
                    if (isCtrlOrCmd && currentThreadId) {
                        event.preventDefault();
                        const currentThread = flattenedThreads.find((t) => t.threadId === currentThreadId);

                        if (currentThread) {
                            if (currentThread.isPinned) {
                                handleUnpinThread(currentThreadId);
                            } else {
                                handlePinThread(currentThreadId);
                            }
                        }
                    }

                    break;
                }

                default: {
                    break;
                }
            }
        },
        [
            currentThreadId,
            flattenedThreads,
            selectedThreadIndex,
            isKeyboardNavigating,
            navigate,
            handleDeleteThread,
            handlePinThread,
            handleUnpinThread,
            handleCreateBranch,
            updateThread,
            setShowKeyboardHelp,
            setShowSearch,
        ],
    );

    // Add keyboard event listeners
    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleKeyDown]);

    // Reset keyboard navigation when threads change
    useEffect(() => {
        if (isKeyboardNavigating && selectedThreadIndex >= flattenedThreads.length) {
            setSelectedThreadIndex(flattenedThreads.length - 1);
        }
    }, [flattenedThreads.length, selectedThreadIndex, isKeyboardNavigating]);

    // Reset keyboard navigation on mouse interaction
    const handleMouseEnter = useCallback(() => {
        if (isKeyboardNavigating) {
            setIsKeyboardNavigating(false);
            setSelectedThreadIndex(-1);
        }
    }, [isKeyboardNavigating]);

    // Virtual scrolling setup
    const parentReference = useRef<HTMLDivElement>(null);

    // Flatten all visible items for virtualization (groups + threads)
    const virtualItems = useMemo(() => {
        const items: ({ group: ThreadGroup; groupType: GroupType; type: "group" } | { index: number; thread: BranchNode; type: "thread" })[] = [];

        threadGroups.forEach((group) => {
            const groupType
                = group.title === "Pinned"
                    ? "pinned"
                    : group.title === "Today"
                        ? "today"
                        : group.title === "Last 7 days"
                            ? "last7days"
                            : group.title === "Last month"
                                ? "lastMonth"
                                : group.title === "Archived"
                                    ? "archived"
                                    : "older";

            // Add group header
            items.push({ group, groupType, type: "group" });

            // Add threads if group is not collapsed
            if (!group.isCollapsed) {
                group.threads.forEach((thread, index) => {
                    items.push({ index, thread, type: "thread" });
                });
            }
        });

        return items;
    }, [threadGroups]);

    // Always call virtualizer hook to avoid "more hooks" error
    const virtualizer = useVirtualizer({
        count: virtualItems.length,
        estimateSize: (index) => {
            const item = virtualItems[index];

            return item?.type === "group" ? 32 : 44; // Group headers are shorter
        },
        getScrollElement: () => parentReference.current,
        overscan: 10,
    });

    // Sortable thread item component
    const SortableThreadItem: FC<{ index?: number; node: BranchNode }> = ({ index, node }) => {
        const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({ id: node.threadId });

        const isKeyboardSelected = isKeyboardNavigating && index === selectedThreadIndex;

        const style = {
            opacity: isDragging ? 0.5 : 1,
            transform: CSS.Transform.toString(transform),
            transition,
        };

        return (
            <div ref={setNodeRef} style={style} {...attributes} onMouseEnter={handleMouseEnter}>
                {renderThreadNode(node, listeners, isKeyboardSelected)}
            </div>
        );
    };

    const renderThreadNode = (node: BranchNode, dragListeners?: any, isKeyboardSelected?: boolean): JSX.Element => {
        const isActive = currentThreadId === node.threadId;
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedThreads.has(node.threadId);
        const isRootThread = node.depth === 0;

        // Check loading states for this thread
        const isPinning = loadingStates.pinning.has(node.threadId);
        const isDeleting = loadingStates.deleting.has(node.threadId);
        const isBranching = loadingStates.branching.has(node.threadId);
        const isDownloading = loadingStates.downloading.has(node.threadId);
        const isArchiving = loadingStates.archiving.has(node.threadId);

        return (
            <TooltipProvider>
                <div
                    className={cn(
                        "cursor-pointer hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                        isActive && "bg-white/20",
                        isKeyboardSelected && "bg-white/10 ring-2 ring-white/50",
                        !isRootThread && "ml-6",
                        (isDeleting || loadingStates.reordering) && "pointer-events-none opacity-50",
                    )}
                    onClick={() => navigate({ params: { threadId: node.threadId }, search: { initialMessage: undefined }, to: "/chat/$threadId" })}
                >
                    <div className="group/action-item relative flex items-center gap-2 overflow-hidden rounded-lg px-2.5 py-2">
                        {/* Drag handle - only show if not loading */}
                        {!isDeleting && !loadingStates.reordering && (
                            <div className="opacity-0 transition-opacity group-hover/action-item:opacity-100" {...dragListeners}>
                                <GripVertical className="h-3 w-3 cursor-grab text-white/60 active:cursor-grabbing" />
                            </div>
                        )}

                        {/* Loading indicator for reordering */}
                        {loadingStates.reordering && <Loader2 className="h-3 w-3 animate-spin text-white/60" />}

                        {/* Expand/collapse button for threads with children */}
                        {hasChildren && (
                            <Button
                                className="h-4 w-4 p-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpanded(node.threadId);
                                }}
                                size="sm"
                                variant="icon"
                            >
                                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            </Button>
                        )}

                        {/* Thread title */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className={cn("-mr-4 flex-1 cursor-pointer truncate text-sm text-white", node.status === "archived" && "-mr-9")}>
                                    {node.title}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs" side="right">
                                <p className="break-words">{node.title}</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Action buttons */}
                        <div className="bg-accent-foreground/80 absolute right-0 flex items-center gap-1 rounded-l-lg opacity-0 transition-opacity group-hover/action-item:opacity-100">
                            {/* Pin/Unpin button - only show for non-archived threads */}
                            {node.status !== "archived" && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            className="hover:text-primary h-6 w-6 p-0"
                                            disabled={isPinning}
                                            onClick={(e) => {
                                                e.stopPropagation();

                                                if (isPinning)
                                                    return; // Prevent multiple clicks

                                                if (node.isPinned) {
                                                    handleUnpinThread(node.threadId);
                                                } else {
                                                    handlePinThread(node.threadId);
                                                }
                                            }}
                                            size="sm"
                                            variant="icon"
                                        >
                                            {isPinning
                                                ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                )
                                                : node.isPinned
                                                    ? (
                                                        <PinOff className="h-3 w-3" />
                                                    )
                                                    : (
                                                        <Pin className="h-3 w-3" />
                                                    )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{isPinning ? "Processing..." : node.isPinned ? "Unpin thread" : "Pin thread"}</TooltipContent>
                                </Tooltip>
                            )}

                            {/* Branch button */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        className="hover:text-primary h-6 w-6 p-0"
                                        disabled={isBranching}
                                        onClick={(e) => {
                                            e.stopPropagation();

                                            if (isBranching)
                                                return; // Prevent multiple clicks

                                            handleCreateBranch(node.threadId);
                                        }}
                                        size="sm"
                                        variant="icon"
                                    >
                                        {isBranching ? <Loader2 className="h-3 w-3 animate-spin" /> : <GitBranch className="h-3 w-3" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isBranching ? "Creating branch..." : "Create branch"}</TooltipContent>
                            </Tooltip>

                            {/* Download Button */}
                            <DropdownMenu>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                className="hover:text-primary h-6 w-6 p-0"
                                                disabled={isDownloading}
                                                onClick={(e) => e.stopPropagation()}
                                                size="sm"
                                                variant="icon"
                                            >
                                                {isDownloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <DownloadIcon className="h-3 w-3" />}
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>{isDownloading ? "Downloading..." : "Download thread"}</TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem onClick={() => handleDownloadThread(node, "json")}>JSON</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownloadThread(node, "txt")}>TXT</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownloadThread(node, "pdf")}>PDF</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        className="hover:text-primary h-6 w-6 p-0"
                                        disabled={isArchiving}
                                        onClick={(e) => {
                                            e.stopPropagation();

                                            if (isArchiving)
                                                return;

                                            const model = node.model || "gemini-1.5-flash"; // Default model

                                            if (node.status === "archived") {
                                                updateThread(node.threadId, model, "active");
                                            } else {
                                                updateThread(node.threadId, model, "archived");
                                            }
                                        }}
                                        size="sm"
                                        variant="icon"
                                    >
                                        {isArchiving ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArchiveIcon className="h-3 w-3" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {isArchiving ? "Processing..." : node.status === "archived" ? "Unarchive thread" : "Archive thread"}
                                </TooltipContent>
                            </Tooltip>

                            {/* Delete button */}
                            <AlertDialog>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                className="hover:text-destructive h-6 w-6 p-0"
                                                disabled={isDeleting}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                }}
                                                size="sm"
                                                variant="icon"
                                            >
                                                {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrashIcon className="h-3 w-3" />}
                                            </Button>
                                        </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>{isDeleting ? t`Deleting...` : t`Delete thread`}</TooltipContent>
                                </Tooltip>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{t`Delete Thread`}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {t`Are you sure you want to delete this thread? This action cannot be undone and will permanently remove all messages in this conversation.`}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{t`Cancel`}</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={() => {
                                                if (isDeleting)
                                                    return; // Prevent multiple clicks

                                                handleDeleteThread(node.threadId);
                                            }}
                                        >
                                            {t`Delete`}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        {/* Status indicators */}
                        {node.status === "archived" && <ArchiveIcon className="text-muted-foreground h-3 w-3 flex-shrink-0" />}
                        {searchQuery.trim() && node.relevantMessages && node.relevantMessages.length > 0 && (
                            <div className="bg-primary/10 text-primary flex-shrink-0 rounded-full px-1.5 py-0.5 text-xs">
                                {node.relevantMessages.length}
                                {" "}
                                match
                                {node.relevantMessages.length === 1 ? "" : "es"}
                            </div>
                        )}
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div className="relative">
                        <div
                            className="bg-border absolute w-px"
                            style={{
                                height: `${node.children.length * 44}px`,
                                left: `${node.depth * 20 + 10}px`,
                                top: "0px",
                            }}
                        />
                        {node.children.map((child, childIndex) => (
                            <SortableThreadItem index={childIndex} key={child.threadId} node={child} />
                        ))}
                    </div>
                )}
            </TooltipProvider>
        );
    };

    // Show loading state if threads are still loading
    if (!threadsData) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">{t`Loading threads...`}</span>
                </div>
            </div>
        );
    }

    // Show empty state if no threads
    if (threadsData.page.length === 0 && !searchQuery.trim()) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <p className="text-muted-foreground">{t`No threads yet`}</p>
                <p className="text-muted-foreground text-xs">{t`Start a new conversation to create your first thread`}</p>
                <p className="mt-2 text-xs opacity-70">{t`Press ? for keyboard shortcuts`}</p>
            </div>
        );
    }

    // Show empty state for search results
    if (threadGroups.length === 0 && searchQuery.trim()) {
        return (
            <div className="text-muted-foreground px-3 py-8 text-center text-sm">
                {isSearchLoading
                    ? (
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Searching...</span>
                        </div>
                    )
                    : (
                        <>
                            <p>
                                No
                                {" "}
                                {searchType === "threads" ? "threads" : "messages"}
                                {" "}
                                found for "
                                {searchQuery}
                                "
                            </p>
                            <p className="mt-1 text-xs">
                                {searchType === "threads" ? "Try searching in thread titles or summaries" : "Try searching in message content"}
                            </p>
                        </>
                    )}
                <p className="mt-2 text-xs opacity-70">Press ? for keyboard shortcuts</p>
            </div>
        );
    }

    const customMappings = {
        "?": { label: "Question Mark", symbols: { default: "?" } },
        a: { label: "A", symbols: { default: "A" } },
        b: { label: "B", symbols: { default: "B" } },
        d: { label: "D", symbols: { default: "D" } },
        f: { label: "F", symbols: { default: "F" } },
        n: { label: "N", symbols: { default: "N" } },
        p: { label: "P", symbols: { default: "P" } },
    };

    // Keyboard shortcuts help overlay
    const KeyboardHelp = () => {
        if (!showKeyboardHelp)
            return null;

        return (
            <div className="bg-background/95 absolute inset-0 z-50 rounded-lg border p-4 backdrop-blur-sm">
                <ShortcutsProvider keyMappings={customMappings}>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
                            <Button className="h-6 w-6 p-0" onClick={() => setShowKeyboardHelp(false)} size="sm" variant="icon">
                                ×
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">New thread</span>
                                <KeyCombo keyNames={[Keys.Command, "n"]} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Delete thread</span>
                                <KeyCombo keyNames={[Keys.Command, "d"]} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Pin/Unpin thread</span>
                                <KeyCombo keyNames={[Keys.Command, "p"]} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Create branch</span>
                                <KeyCombo keyNames={[Keys.Command, "b"]} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Archive/Unarchive thread</span>
                                <KeyCombo keyNames={[Keys.Command, "a"]} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Search threads</span>
                                <KeyCombo keyNames={[Keys.Command, "f"]} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Navigate threads</span>
                                <KeyCombo keyNames={[Keys.ArrowUp, Keys.ArrowDown]} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Open thread</span>
                                <KeySymbol keyName={Keys.Enter} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Show/hide help</span>
                                <KeySymbol keyName="?" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Cancel/escape</span>
                                <KeySymbol keyName={Keys.Escape} />
                            </div>
                        </div>
                    </div>
                </ShortcutsProvider>
            </div>
        );
    };

    // Render thread groups with virtualization
    const renderThreadGroups = () => {
        // Determine if we should use virtual scrolling based on total items
        const shouldUseVirtualScrolling = virtualItems.length > 100;

        if (!shouldUseVirtualScrolling) {
            // Non-virtualized rendering for small lists
            return (
                <div className="space-y-3">
                    {threadGroups.map((group) => (
                        <div className="space-y-1" key={group.title}>
                            {/* Group Header */}
                            <div
                                className="flex cursor-pointer items-center gap-2 px-2 py-1 text-xs font-medium text-white/70 hover:text-white"
                                onClick={() => {
                                    const groupType
                                        = group.title === "Pinned"
                                            ? "pinned"
                                            : group.title === "Today"
                                                ? "today"
                                                : group.title === "Last 7 days"
                                                    ? "last7days"
                                                    : group.title === "Last month"
                                                        ? "lastMonth"
                                                        : group.title === "Archived"
                                                            ? "archived"
                                                            : "older";

                                    toggleGroupCollapsed(groupType);
                                }}
                            >
                                {group.isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                <span>{group.title}</span>
                                <span className="text-white/50">
                                    (
                                    {group.threads.length}
                                    )
                                </span>
                            </div>

                            {/* Group Threads */}
                            {!group.isCollapsed && (
                                <div className="space-y-1">
                                    {group.threads.map((thread, threadIndex) => (
                                        <SortableThreadItem index={threadIndex} key={thread.threadId} node={thread} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        // Virtualized rendering for large lists
        return (
            <div
                className="h-full overflow-auto"
                ref={parentReference}
                style={{
                    height: "100%",
                    width: "100%",
                }}
            >
                <div
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        position: "relative",
                        width: "100%",
                    }}
                >
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                        const item = virtualItems[virtualItem.index];

                        if (!item)
                            return null;

                        return (
                            <div
                                key={virtualItem.key}
                                style={{
                                    height: `${virtualItem.size}px`,
                                    left: 0,
                                    position: "absolute",
                                    top: 0,
                                    transform: `translateY(${virtualItem.start}px)`,
                                    width: "100%",
                                }}
                            >
                                {item.type === "group" ? (
                                    // Group Header
                                    <div
                                        className="flex cursor-pointer items-center gap-2 px-2 py-1 text-xs font-medium text-white/70 hover:text-white"
                                        onClick={() => toggleGroupCollapsed(item.groupType)}
                                    >
                                        {item.group.isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                        <span>{item.group.title}</span>
                                        <span className="text-white/50">
                                            (
                                            {item.group.threads.length}
                                            )
                                        </span>
                                    </div>
                                ) : (
                                    // Thread Item
                                    <SortableThreadItem index={item.index} key={item.thread.threadId} node={item.thread} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Get all thread IDs for sortable context
    const allThreadIds = threadGroups.flatMap((group) => group.threads.map((thread) => thread.threadId));

    // Regular rendering with groups
    return (
        <div className="relative">
            <KeyboardHelp />
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
                <SortableContext items={allThreadIds} strategy={verticalListSortingStrategy}>
                    {renderThreadGroups()}
                </SortableContext>
            </DndContext>
        </div>
    );
};
