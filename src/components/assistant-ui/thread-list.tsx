import type { FC } from "react";
import { ThreadListPrimitive } from "@assistant-ui/react";
import {
    ArchiveIcon,
    PlusIcon,
    TrashIcon,
    GitBranch,
    ChevronRight,
    ChevronDown,
    Pin,
    PinOff,
    GripVertical,
    HelpCircle,
    Search,
    X,
    Loader2,
    DownloadIcon,
} from "lucide-react";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useConvex } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { api } from "@cvx/_generated/api";
import { ShortcutsProvider, KeyCombo, KeySymbol, Keys } from "@/components/ui/keyboard-shortcuts";
import { Input } from "@/components/ui/input";
import { useSession } from "@/features/auth/hooks/auth-hooks";
import { useThreadContext } from "@/features/chat/components/thread-context";
import { handleDownload, type DownloadFormat } from "@/lib/download";
import type { Doc } from "@cvx/_generated/dataModel";

// Type definitions for thread hierarchy
interface BranchNode {
    threadId: string;
    title: string;
    status: string;
    branchPoint: number;
    branchType: string;
    createdAt: number;
    children: BranchNode[];
    depth: number;
    isPinned?: boolean;
    order?: number;
    model?: string;
    relevantMessages?: any[]; // Messages that matched the search query
}

export const ThreadList: FC = () => {
    const sessionData = useSession();
    const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
    const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [searchType, setSearchType] = useState<"threads" | "messages">("threads");
    const [loadingStates, setLoadingStates] = useState<{
        pinning: Set<string>;
        deleting: Set<string>;
        branching: Set<string>;
        reordering: boolean;
        downloading: Set<string>;
    }>({
        pinning: new Set(),
        deleting: new Set(),
        branching: new Set(),
        reordering: false,
        downloading: new Set(),
    });

    // Search threads when there's a search query and search type is "threads"
    const threadSearchResults = useQuery(
        api.chat.functions.searchThreads,
        sessionData?.data?.session?.token && searchQuery.trim() && searchType === "threads"
            ? {
                searchQuery: searchQuery.trim(),
                sessionToken: sessionData.data.session.token,
                paginationOpts: { numItems: 100, cursor: null },
            }
            : "skip",
    );

    // Search messages when there's a search query and search type is "messages"
    const messageSearchResults = useQuery(
        api.chat.functions.searchMessages,
        sessionData?.data?.session?.token && searchQuery.trim() && searchType === "messages"
            ? {
                searchQuery: searchQuery.trim(),
                sessionToken: sessionData.data.session.token,
                paginationOpts: { numItems: 100, cursor: null },
            }
            : "skip",
    );

    // Check if search is loading
    const isSearchLoading = searchQuery.trim() && ((searchType === "threads" && !threadSearchResults) || (searchType === "messages" && !messageSearchResults));

    const toggleExpanded = (threadId: string) => {
        setExpandedThreads((prev) => {
            const next = new Set(prev);
            if (next.has(threadId)) {
                next.delete(threadId);
            } else {
                next.add(threadId);
            }
            return next;
        });
    };

    return (
        <ThreadListPrimitive.Root className="flex flex-col items-stretch gap-1.5 text-white">
            <div className="flex items-center gap-2">
                <ThreadListNew />
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/10 hover:text-white" onClick={() => setShowSearch(!showSearch)}>
                                <Search className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Search threads (Ctrl+F)</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/10 hover:text-white" onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}>
                                <HelpCircle className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Keyboard shortcuts (?)</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            {showSearch && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Button
                            variant={searchType === "threads" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSearchType("threads")}
                            className="text-xs border-white/20 text-white hover:bg-white/10 data-[active]:bg-white/20"
                        >
                            Threads
                        </Button>
                        <Button
                            variant={searchType === "messages" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSearchType("messages")}
                            className="text-xs border-white/20 text-white hover:bg-white/10 data-[active]:bg-white/20"
                        >
                            Messages
                        </Button>
                    </div>
                    <div className="relative">
                        <Input
                            placeholder={searchType === "threads" ? "Search thread titles..." : "Search message content..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-8 bg-white/5 border-white/20 text-white placeholder:text-white/60"
                            autoFocus
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 p-0"
                                onClick={() => setSearchQuery("")}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                        {isSearchLoading && (
                            <div className="absolute top-1/2 right-8 -translate-y-1/2">
                                <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            )}
            <HierarchicalThreadList
                expandedThreads={expandedThreads}
                toggleExpanded={toggleExpanded}
                showKeyboardHelp={showKeyboardHelp}
                setShowKeyboardHelp={setShowKeyboardHelp}
                searchQuery={searchQuery}
                searchType={searchType}
                setShowSearch={setShowSearch}
                loadingStates={loadingStates}
                setLoadingStates={setLoadingStates}
                isSearchLoading={isSearchLoading}
                threadSearchResults={threadSearchResults}
                messageSearchResults={messageSearchResults}
            />
        </ThreadListPrimitive.Root>
    );
};

const ThreadListNew: FC = () => {
    return (
        <ThreadListPrimitive.New asChild>
            <Button className="data-[active]:bg-white/20 hover:bg-white/10 flex items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start text-white" variant="ghost">
                <PlusIcon />
                New Thread
            </Button>
        </ThreadListPrimitive.New>
    );
};

// Unified hierarchical thread list that shows parent-child relationships
interface HierarchicalThreadListProps {
    expandedThreads: Set<string>;
    toggleExpanded: (threadId: string) => void;
    showKeyboardHelp: boolean;
    setShowKeyboardHelp: React.Dispatch<React.SetStateAction<boolean>>;
    searchQuery: string;
    searchType: "threads" | "messages";
    setShowSearch: React.Dispatch<React.SetStateAction<boolean>>;
    loadingStates: {
        pinning: Set<string>;
        deleting: Set<string>;
        branching: Set<string>;
        reordering: boolean;
        downloading: Set<string>;
    };
    setLoadingStates: React.Dispatch<
        React.SetStateAction<{
            pinning: Set<string>;
            deleting: Set<string>;
            branching: Set<string>;
            reordering: boolean;
            downloading: Set<string>;
        }>
    >;
    isSearchLoading: boolean;
    threadSearchResults: any;
    messageSearchResults: any;
}

const HierarchicalThreadList: FC<HierarchicalThreadListProps> = ({
    expandedThreads,
    toggleExpanded,
    showKeyboardHelp,
    setShowKeyboardHelp,
    searchQuery,
    searchType,
    setShowSearch,
    loadingStates,
    setLoadingStates,
    isSearchLoading,
    threadSearchResults,
    messageSearchResults,
}) => {
    const { currentThreadId, createBranch, deleteBranch, threads } = useThreadContext();
    const sessionData = useSession();
    const navigate = useNavigate();
    const convex = useConvex();

    // Keyboard navigation state
    const [selectedThreadIndex, setSelectedThreadIndex] = useState<number>(-1);
    const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);

    // Get all threads to build the hierarchy
    const threadsData = useQuery(
        api.chat.functions.getThreads,
        sessionData?.data?.session?.token ? { sessionToken: sessionData.data.session.token, paginationOpts: { numItems: 100, cursor: null } } : "skip",
    );

    // Get thread relationships to build hierarchy
    const threadRelationships = useQuery(
        api.chat.functions.getAllThreadRelationships,
        sessionData?.data?.session?.token ? { sessionToken: sessionData.data.session.token } : "skip",
    );

    // Get pinned threads
    const pinnedThreads = useQuery(
        api.chat.functions.getPinnedThreads,
        sessionData?.data?.session?.token ? { sessionToken: sessionData.data.session.token } : "skip",
    );

    // Get thread orders
    const threadOrders = useQuery(
        api.chat.functions.getThreadOrders,
        sessionData?.data?.session?.token ? { sessionToken: sessionData.data.session.token } : "skip",
    );

    // Pin/unpin mutations
    const pinThreadMutation = useMutation(api.chat.functions.pinThread);
    const unpinThreadMutation = useMutation(api.chat.functions.unpinThread);

    // Thread order mutation
    const updateThreadOrderMutation = useMutation(api.chat.functions.updateThreadOrder);

    // Build the hierarchical structure
    const threadHierarchy = useMemo(() => {
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

        if (!threadsToUse || !threadRelationships) return [];

        // Create maps for quick lookups
        const threadMap = new Map(threadsToUse.map((thread: any) => [thread._id, thread]));
        const relationshipMap = new Map(threadRelationships.map((rel: any) => [rel.threadId, rel]));
        const pinnedThreadsSet = new Set(pinnedThreads?.map((pin: any) => pin.threadId) || []);
        const threadOrderMap = new Map(threadOrders?.map((order: any) => [order.threadId, order.order]) || []);

        // Find root threads (threads without parent relationships)
        const rootThreads = threadsToUse.filter((thread: any) => !relationshipMap.has(thread._id));

        const buildHierarchy = (threadId: string, depth: number = 0): BranchNode | null => {
            const thread = threadMap.get(threadId);
            if (!thread) return null;

            // Find direct children using relationships
            const childRelationships = threadRelationships.filter((rel: any) => rel.parentThreadId === threadId);
            const children = childRelationships.map((rel: any) => buildHierarchy(rel.threadId, depth + 1)).filter((node): node is BranchNode => node !== null);

            return {
                threadId: thread._id,
                title: thread.title || "New Chat",
                status: thread.status || "active",
                branchPoint: relationshipMap.get(threadId)?.branchPoint || 0,
                branchType: relationshipMap.get(threadId)?.branchType || "branch",
                createdAt: thread._creationTime,
                children,
                depth,
                isPinned: pinnedThreadsSet.has(threadId),
                order: threadOrderMap.get(threadId),
                model: thread.model,
                // Add search relevance info if available (for message search)
                relevantMessages: thread.relevantMessages,
            };
        };

        const hierarchy = rootThreads.map((thread: any) => buildHierarchy(thread._id)).filter((node): node is BranchNode => node !== null);

        // Sort: if searching, sort by relevance first, otherwise use normal sorting
        return hierarchy.sort((a, b) => {
            // If we have message search results, sort by relevance first
            if (searchQuery.trim() && searchType === "messages" && messageSearchResults?.page) {
                const aRelevance = a.relevantMessages?.length || 0;
                const bRelevance = b.relevantMessages?.length || 0;

                if (aRelevance !== bRelevance) {
                    return bRelevance - aRelevance; // More relevant first
                }
            }

            // Normal sorting: pinned threads first, then by custom order, then by newest first
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;

            // Within pinned/unpinned groups, sort by custom order if available
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            if (a.order !== undefined && b.order === undefined) return -1;
            if (a.order === undefined && b.order !== undefined) return 1;

            // Finally, sort by creation time (newest first)
            return b.createdAt - a.createdAt;
        });
    }, [threadsData?.page, threadSearchResults?.page, messageSearchResults?.page, threadRelationships, pinnedThreads, threadOrders, searchQuery, searchType]);

    const handleDownloadThread = useCallback(
        async (node: BranchNode, format: DownloadFormat) => {
            if (!sessionData?.data?.session?.token) return;
            if (!node.model) {
                console.error("Thread model is unknown, cannot download.");
                // TODO: Add user-facing error notification
                return;
            }

            setLoadingStates((prev) => ({
                ...prev,
                downloading: new Set(prev.downloading).add(node.threadId),
            }));

            try {
                const data = await convex.query(api.chat.functions.getFullThreadForExport, {
                    threadId: node.threadId,
                    sessionToken: sessionData.data.session.token,
                    model: node.model,
                });

                if (data && data.thread && data.messages) {
                    handleDownload(data.thread, data.messages as (Doc<"messages"> | Doc<"toolMessages">)[], format);
                }
            } catch (error) {
                console.error("Failed to download thread:", error);
            } finally {
                setLoadingStates((prev) => {
                    const newDownloading = new Set(prev.downloading);
                    newDownloading.delete(node.threadId);
                    return { ...prev, downloading: newDownloading };
                });
            }
        },
        [convex, setLoadingStates, sessionData],
    );

    const handleCreateBranch = async (threadId: string) => {
        setLoadingStates((prev) => ({
            ...prev,
            branching: new Set(prev.branching).add(threadId),
        }));

        try {
            const currentMessages = threads.get(threadId) || [];
            if (currentMessages.length > 0) {
                await createBranch(threadId, currentMessages.length - 1, "New Branch");
            }
        } catch (error) {
            console.error("Failed to create branch:", error);
        } finally {
            setLoadingStates((prev) => {
                const newBranching = new Set(prev.branching);
                newBranching.delete(threadId);
                return {
                    ...prev,
                    branching: newBranching,
                };
            });
        }
    };

    const handleDeleteThread = async (threadId: string) => {
        setLoadingStates((prev) => ({
            ...prev,
            deleting: new Set(prev.deleting).add(threadId),
        }));

        try {
            await deleteBranch(threadId);
        } catch (error) {
            console.error("Failed to delete thread:", error);
        } finally {
            setLoadingStates((prev) => {
                const newDeleting = new Set(prev.deleting);
                newDeleting.delete(threadId);
                return {
                    ...prev,
                    deleting: newDeleting,
                };
            });
        }
    };

    const handlePinThread = async (threadId: string) => {
        if (!sessionData?.data?.session?.token) return;

        setLoadingStates((prev) => ({
            ...prev,
            pinning: new Set(prev.pinning).add(threadId),
        }));

        try {
            await pinThreadMutation({
                threadId,
                sessionToken: sessionData.data.session.token,
            });
        } catch (error) {
            console.error("Failed to pin thread:", error);
        } finally {
            setLoadingStates((prev) => {
                const newPinning = new Set(prev.pinning);
                newPinning.delete(threadId);
                return {
                    ...prev,
                    pinning: newPinning,
                };
            });
        }
    };

    const handleUnpinThread = async (threadId: string) => {
        if (!sessionData?.data?.session?.token) return;

        setLoadingStates((prev) => ({
            ...prev,
            pinning: new Set(prev.pinning).add(threadId),
        }));

        try {
            await unpinThreadMutation({
                threadId,
                sessionToken: sessionData.data.session.token,
            });
        } catch (error) {
            console.error("Failed to unpin thread:", error);
        } finally {
            setLoadingStates((prev) => {
                const newPinning = new Set(prev.pinning);
                newPinning.delete(threadId);
                return {
                    ...prev,
                    pinning: newPinning,
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

    // Handle drag end
    const handleDragEnd = async (event: any) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;
        if (!sessionData?.data?.session?.token) return;

        const oldIndex = threadHierarchy.findIndex((thread) => thread.threadId === active.id);
        const newIndex = threadHierarchy.findIndex((thread) => thread.threadId === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        setLoadingStates((prev) => ({
            ...prev,
            reordering: true,
        }));

        // Create new order based on the reordered array
        const reorderedThreads = arrayMove(threadHierarchy, oldIndex, newIndex);

        // Generate new order values
        const threadOrderUpdates = reorderedThreads.map((thread, index) => ({
            threadId: thread.threadId,
            order: index,
        }));

        try {
            await updateThreadOrderMutation({
                threadOrders: threadOrderUpdates,
                sessionToken: sessionData.data.session.token,
            });
        } catch (error) {
            console.error("Failed to update thread order:", error);
        } finally {
            setLoadingStates((prev) => ({
                ...prev,
                reordering: false,
            }));
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
                case "n":
                case "N":
                    if (isCtrlOrCmd) {
                        event.preventDefault();
                        // Create new thread
                        navigate({ to: "/chat/new" });
                    }
                    break;

                case "d":
                case "D":
                    if (isCtrlOrCmd && currentThreadId) {
                        event.preventDefault();
                        handleDeleteThread(currentThreadId);
                    }
                    break;

                case "p":
                case "P":
                    if (isCtrlOrCmd && currentThreadId) {
                        event.preventDefault();
                        const currentThread = threadHierarchy.find((t) => t.threadId === currentThreadId);
                        if (currentThread) {
                            if (currentThread.isPinned) {
                                handleUnpinThread(currentThreadId);
                            } else {
                                handlePinThread(currentThreadId);
                            }
                        }
                    }
                    break;

                case "b":
                case "B":
                    if (isCtrlOrCmd && currentThreadId) {
                        event.preventDefault();
                        handleCreateBranch(currentThreadId);
                    }
                    break;

                case "ArrowUp":
                    if (!isCtrlOrCmd) {
                        event.preventDefault();
                        setIsKeyboardNavigating(true);
                        setSelectedThreadIndex((prev) => {
                            const newIndex = prev <= 0 ? threadHierarchy.length - 1 : prev - 1;
                            return newIndex;
                        });
                    }
                    break;

                case "ArrowDown":
                    if (!isCtrlOrCmd) {
                        event.preventDefault();
                        setIsKeyboardNavigating(true);
                        setSelectedThreadIndex((prev) => {
                            const newIndex = prev >= threadHierarchy.length - 1 ? 0 : prev + 1;
                            return newIndex;
                        });
                    }
                    break;

                case "Enter":
                    if (isKeyboardNavigating && selectedThreadIndex >= 0 && selectedThreadIndex < threadHierarchy.length) {
                        event.preventDefault();
                        const selectedThread = threadHierarchy[selectedThreadIndex];
                        navigate({ to: "/chat/$threadId", params: { threadId: selectedThread.threadId } });
                        setIsKeyboardNavigating(false);
                        setSelectedThreadIndex(-1);
                    }
                    break;

                case "Escape":
                    event.preventDefault();
                    setIsKeyboardNavigating(false);
                    setSelectedThreadIndex(-1);
                    setShowKeyboardHelp(false);
                    break;

                case "?":
                    if (!isCtrlOrCmd) {
                        event.preventDefault();
                        setShowKeyboardHelp((prev) => !prev);
                    }
                    break;

                case "f":
                case "F":
                    if (isCtrlOrCmd) {
                        event.preventDefault();
                        setShowSearch((prev) => !prev);
                    }
                    break;

                default:
                    break;
            }
        },
        [
            currentThreadId,
            threadHierarchy,
            selectedThreadIndex,
            isKeyboardNavigating,
            navigate,
            handleDeleteThread,
            handlePinThread,
            handleUnpinThread,
            handleCreateBranch,
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
        if (isKeyboardNavigating && selectedThreadIndex >= threadHierarchy.length) {
            setSelectedThreadIndex(threadHierarchy.length - 1);
        }
    }, [threadHierarchy.length, selectedThreadIndex, isKeyboardNavigating]);

    // Reset keyboard navigation on mouse interaction
    const handleMouseEnter = useCallback(() => {
        if (isKeyboardNavigating) {
            setIsKeyboardNavigating(false);
            setSelectedThreadIndex(-1);
        }
    }, [isKeyboardNavigating]);

    const flattenedThreads = useMemo(() => {
        const flattened: BranchNode[] = [];

        const flattenNode = (node: BranchNode) => {
            flattened.push(node);
            if (expandedThreads.has(node.threadId)) {
                node.children.forEach(flattenNode);
            }
        };

        threadHierarchy.forEach(flattenNode);

        return flattened;
    }, [threadHierarchy, expandedThreads]);

    // Virtual scrolling setup
    const parentRef = useRef<HTMLDivElement>(null);
    const shouldUseVirtualScrolling = flattenedThreads.length > 100;

    const virtualizer = useVirtualizer({
        count: flattenedThreads.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 44, // Estimated height of each thread item
        overscan: 10,
    });

    // Sortable thread item component
    const SortableThreadItem: FC<{ node: BranchNode; index?: number }> = ({ node, index }) => {
        const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.threadId });

        const isKeyboardSelected = isKeyboardNavigating && index === selectedThreadIndex;

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
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

        return (
            <TooltipProvider>
                <div
                    className={cn(
                        "hover:bg-white/10 focus-visible:bg-white/10 focus-visible:ring-white/50 cursor-pointer focus-visible:ring-2 focus-visible:outline-none",
                        isActive && "bg-white/20",
                        isKeyboardSelected && "ring-white/50 bg-white/10 ring-2",
                        !isRootThread && "ml-6",
                        (isDeleting || loadingStates.reordering) && "pointer-events-none opacity-50",
                    )}
                    onClick={() => navigate({ to: "/chat/$threadId", params: { threadId: node.threadId }, search: { initialMessage: undefined } })}
                >
                    <div className="flex items-center gap-2 rounded-lg px-2.5 py-2">
                        {/* Drag handle - only show if not loading */}
                        {!isDeleting && !loadingStates.reordering && (
                            <div className="opacity-0 transition-opacity group-hover:opacity-100" {...dragListeners}>
                                <GripVertical className="text-white/60 h-3 w-3 cursor-grab active:cursor-grabbing" />
                            </div>
                        )}

                        {/* Loading indicator for reordering */}
                        {loadingStates.reordering && <Loader2 className="text-white/60 h-3 w-3 animate-spin" />}

                        {/* Expand/collapse button for threads with children */}
                        {hasChildren && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpanded(node.threadId);
                                }}
                            >
                                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            </Button>
                        )}

                        {/* Thread title */}
                        <span className="flex-1 truncate text-sm text-white">{node.title}</span>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {/* Pin/Unpin button */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="hover:text-primary h-6 w-6 p-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isPinning) return; // Prevent multiple clicks
                                            if (node.isPinned) {
                                                handleUnpinThread(node.threadId);
                                            } else {
                                                handlePinThread(node.threadId);
                                            }
                                        }}
                                        disabled={isPinning}
                                    >
                                        {isPinning ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : node.isPinned ? (
                                            <PinOff className="h-3 w-3" />
                                        ) : (
                                            <Pin className="h-3 w-3" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isPinning ? "Processing..." : node.isPinned ? "Unpin thread" : "Pin thread"}</TooltipContent>
                            </Tooltip>

                            {/* Branch button */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="hover:text-primary h-6 w-6 p-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isBranching) return; // Prevent multiple clicks
                                            handleCreateBranch(node.threadId);
                                        }}
                                        disabled={isBranching}
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
                                                variant="ghost"
                                                size="sm"
                                                className="hover:text-primary h-6 w-6 p-0"
                                                onClick={(e) => e.stopPropagation()}
                                                disabled={isDownloading}
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

                            {/* Archive button (placeholder) */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="hover:text-primary h-6 w-6 p-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // TODO: Implement archive functionality
                                        }}
                                    >
                                        <ArchiveIcon className="h-3 w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Archive thread</TooltipContent>
                            </Tooltip>

                            {/* Delete button */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="hover:text-destructive h-6 w-6 p-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isDeleting) return; // Prevent multiple clicks
                                            handleDeleteThread(node.threadId);
                                        }}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrashIcon className="h-3 w-3" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isDeleting ? "Deleting..." : "Delete thread"}</TooltipContent>
                            </Tooltip>
                        </div>

                        {/* Status indicators */}
                        {node.status === "archived" && <ArchiveIcon className="text-muted-foreground h-3 w-3 flex-shrink-0" />}
                        {searchQuery.trim() && node.relevantMessages && node.relevantMessages.length > 0 && (
                            <div className="bg-primary/10 text-primary flex-shrink-0 rounded-full px-1.5 py-0.5 text-xs">
                                {node.relevantMessages.length} match{node.relevantMessages.length !== 1 ? "es" : ""}
                            </div>
                        )}
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div className="relative">
                        <div
                            className="bg-border absolute w-px"
                            style={{
                                left: `${node.depth * 20 + 10}px`,
                                top: "0px",
                                height: `${node.children.length * 44}px`,
                            }}
                        />
                        {node.children.map((child, childIndex) => (
                            <SortableThreadItem key={child.threadId} node={child} index={childIndex} />
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
                    <span className="text-sm">Loading threads...</span>
                </div>
            </div>
        );
    }

    // Show empty state if no threads
    if (threadsData.page.length === 0 && !searchQuery.trim()) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <p className="text-muted-foreground">No threads yet</p>
                <p className="text-muted-foreground text-xs">Start a new conversation to create your first thread</p>
                <p className="mt-2 text-xs opacity-70">Press ? for keyboard shortcuts</p>
            </div>
        );
    }

    // Show empty state for search results
    if (!threadHierarchy.length && searchQuery.trim()) {
        return (
            <div className="text-muted-foreground px-3 py-8 text-center text-sm">
                {isSearchLoading ? (
                    <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Searching...</span>
                    </div>
                ) : (
                    <>
                        <p>
                            No {searchType === "threads" ? "threads" : "messages"} found for "{searchQuery}"
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
        n: { symbols: { default: "N" }, label: "N" },
        d: { symbols: { default: "D" }, label: "D" },
        p: { symbols: { default: "P" }, label: "P" },
        b: { symbols: { default: "B" }, label: "B" },
        f: { symbols: { default: "F" }, label: "F" },
        "?": { symbols: { default: "?" }, label: "Question Mark" },
    };

    // Keyboard shortcuts help overlay
    const KeyboardHelp = () =>
        showKeyboardHelp && (
            <div className="bg-background/95 absolute inset-0 z-50 rounded-lg border p-4 backdrop-blur-sm">
                <ShortcutsProvider keyMappings={customMappings}>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowKeyboardHelp(false)} className="h-6 w-6 p-0">
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

    // Get thread IDs for sortable context
    const threadIds = threadHierarchy.map((thread) => thread.threadId);

    // Use virtual scrolling for large lists
    if (shouldUseVirtualScrolling) {
        return (
            <div className="relative">
                <KeyboardHelp />
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={threadIds} strategy={verticalListSortingStrategy}>
                        <div
                            ref={parentRef}
                            className="h-full overflow-auto"
                            style={{
                                height: "400px", // Set a fixed height for the scrollable area
                            }}
                        >
                            <div
                                style={{
                                    height: `${virtualizer.getTotalSize()}px`,
                                    width: "100%",
                                    position: "relative",
                                }}
                            >
                                {virtualizer.getVirtualItems().map((virtualItem) => {
                                    const node = flattenedThreads[virtualItem.index];
                                    // Find the original index in threadHierarchy for keyboard navigation
                                    const originalIndex = threadHierarchy.findIndex((t) => t.threadId === node.threadId);
                                    return (
                                        <div
                                            key={virtualItem.key}
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: `${virtualItem.size}px`,
                                                transform: `translateY(${virtualItem.start}px)`,
                                            }}
                                        >
                                            <SortableThreadItem node={node} index={originalIndex} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        );
    }

    // Regular rendering for smaller lists
    return (
        <div className="relative">
            <KeyboardHelp />
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={threadIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                        {threadHierarchy.map((rootNode, index) => (
                            <SortableThreadItem key={rootNode.threadId} node={rootNode} index={index} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};
