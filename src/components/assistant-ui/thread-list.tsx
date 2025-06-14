import type { FC } from "react";
import { ThreadListPrimitive } from "@assistant-ui/react";
import { ArchiveIcon, PlusIcon, TrashIcon, GitBranch, ChevronRight, ChevronDown, Pin, PinOff, GripVertical } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useThreadContext } from "@/routes/(chat)/-components/thread-context";
import { cn } from "@/lib/utils";
import { api } from "@cvx/_generated/api";
import { useSession } from "@/hooks/auth-hooks";

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
}

export const ThreadList: FC = () => {
    const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

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
        <ThreadListPrimitive.Root className="flex flex-col items-stretch gap-1.5">
            <ThreadListNew />
            <HierarchicalThreadList expandedThreads={expandedThreads} toggleExpanded={toggleExpanded} />
        </ThreadListPrimitive.Root>
    );
};

const ThreadListNew: FC = () => {
    return (
        <ThreadListPrimitive.New asChild>
            <Button className="data-[active]:bg-muted hover:bg-muted flex items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start" variant="ghost">
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
}

const HierarchicalThreadList: FC<HierarchicalThreadListProps> = ({ expandedThreads, toggleExpanded }) => {
    const { currentThreadId, createBranch, deleteBranch, threads } = useThreadContext();
    const sessionData = useSession();
    const navigate = useNavigate();

    // Get all threads to build the hierarchy
    const allThreads = useQuery(
        api.chat.getThreads,
        sessionData?.data?.session?.token ? { sessionToken: sessionData.data.session.token, paginationOpts: { numItems: 100, cursor: null } } : "skip",
    );

    // Get thread relationships to build hierarchy
    const threadRelationships = useQuery(
        api.chat.getAllThreadRelationships,
        sessionData?.data?.session?.token ? { sessionToken: sessionData.data.session.token } : "skip",
    );

    // Get pinned threads
    const pinnedThreads = useQuery(api.chat.getPinnedThreads, sessionData?.data?.session?.token ? { sessionToken: sessionData.data.session.token } : "skip");

    // Get thread orders
    const threadOrders = useQuery(api.chat.getThreadOrders, sessionData?.data?.session?.token ? { sessionToken: sessionData.data.session.token } : "skip");

    // Pin/unpin mutations
    const pinThreadMutation = useMutation(api.chat.pinThread);
    const unpinThreadMutation = useMutation(api.chat.unpinThread);

    // Thread order mutation
    const updateThreadOrderMutation = useMutation(api.chat.updateThreadOrder);

    // Build the hierarchical structure
    const threadHierarchy = useMemo(() => {
        if (!allThreads?.page || !threadRelationships) return [];

        // Create maps for quick lookups
        const threadMap = new Map(allThreads.page.map((thread: any) => [thread._id, thread]));
        const relationshipMap = new Map(threadRelationships.map((rel: any) => [rel.threadId, rel]));
        const pinnedThreadsSet = new Set(pinnedThreads?.map((pin: any) => pin.threadId) || []);
        const threadOrderMap = new Map(threadOrders?.map((order: any) => [order.threadId, order.order]) || []);

        // Find root threads (threads without parent relationships)
        const rootThreads = allThreads.page.filter((thread: any) => !relationshipMap.has(thread._id));

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
            };
        };

        const hierarchy = rootThreads.map((thread: any) => buildHierarchy(thread._id)).filter((node): node is BranchNode => node !== null);

        // Sort: pinned threads first, then by custom order, then by newest first
        return hierarchy.sort((a, b) => {
            // First, sort by pinned status
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
    }, [allThreads?.page, threadRelationships, pinnedThreads, threadOrders]);

    const handleCreateBranch = async (threadId: string) => {
        try {
            const currentMessages = threads.get(threadId) || [];
            if (currentMessages.length > 0) {
                await createBranch(threadId, currentMessages.length - 1, "New Branch");
            }
        } catch (error) {
            console.error("Failed to create branch:", error);
        }
    };

    const handleDeleteThread = async (threadId: string) => {
        try {
            await deleteBranch(threadId);
        } catch (error) {
            console.error("Failed to delete thread:", error);
        }
    };

    const handlePinThread = async (threadId: string) => {
        if (!sessionData?.data?.session?.token) return;

        try {
            await pinThreadMutation({
                threadId,
                sessionToken: sessionData.data.session.token,
            });
        } catch (error) {
            console.error("Failed to pin thread:", error);
        }
    };

    const handleUnpinThread = async (threadId: string) => {
        if (!sessionData?.data?.session?.token) return;

        try {
            await unpinThreadMutation({
                threadId,
                sessionToken: sessionData.data.session.token,
            });
        } catch (error) {
            console.error("Failed to unpin thread:", error);
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
        }
    };

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
    const SortableThreadItem: FC<{ node: BranchNode }> = ({ node }) => {
        const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.threadId });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
        };

        return (
            <div ref={setNodeRef} style={style} {...attributes}>
                {renderThreadNode(node, listeners)}
            </div>
        );
    };

    const renderThreadNode = (node: BranchNode, dragListeners?: any): JSX.Element => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedThreads.has(node.threadId);
        const isActive = currentThreadId === node.threadId;
        const isRootThread = node.depth === 0;

        return (
            <div key={node.threadId} className="relative">
                {/* Connection line for child threads */}
                {!isRootThread && <div className="bg-border absolute top-0 h-6 w-px" style={{ left: `${(node.depth - 1) * 20 + 10}px` }} />}

                {/* Horizontal connection line */}
                {!isRootThread && <div className="bg-border absolute top-6 h-px w-3" style={{ left: `${(node.depth - 1) * 20 + 10}px` }} />}

                {/* Thread Item */}
                <TooltipProvider>
                    <div
                        className={cn(
                            "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all",
                            "hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring cursor-pointer focus-visible:ring-2 focus-visible:outline-none",
                            isActive && "bg-muted",
                            !isRootThread && "ml-6",
                        )}
                        onClick={() => navigate({ to: "/chat/$threadId", params: { threadId: node.threadId } })}
                        style={{ marginLeft: `${node.depth * 20}px` }}
                    >
                        {hasChildren && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpanded(node.threadId);
                                }}
                                className="hover:bg-accent rounded p-1 transition-colors"
                            >
                                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            </button>
                        )}

                        {!isRootThread && <GitBranch className="text-muted-foreground h-3 w-3 flex-shrink-0" />}

                        {/* Pin indicator for pinned threads */}
                        {node.isPinned && <Pin className="text-primary h-3 w-3 flex-shrink-0" />}

                        {/* Drag handle */}
                        {dragListeners && (
                            <div {...dragListeners} className="cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
                                <GripVertical className="text-muted-foreground h-3 w-3" />
                            </div>
                        )}

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="flex-grow cursor-default truncate font-medium">{node.title}</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                                <p className="break-words">{node.title}</p>
                            </TooltipContent>
                        </Tooltip>

                        {hasChildren && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                {node.children.length}
                            </Badge>
                        )}

                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {/* Pin/Unpin Button */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn("h-6 w-6 p-0", node.isPinned ? "hover:text-destructive" : "hover:text-primary")}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (node.isPinned) {
                                                handleUnpinThread(node.threadId);
                                            } else {
                                                handlePinThread(node.threadId);
                                            }
                                        }}
                                    >
                                        {node.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{node.isPinned ? "Unpin thread" : "Pin thread"}</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="hover:text-primary h-6 w-6 p-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCreateBranch(node.threadId);
                                        }}
                                    >
                                        <GitBranch className="h-3 w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Create branch</TooltipContent>
                            </Tooltip>

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

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="hover:text-destructive h-6 w-6 p-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteThread(node.threadId);
                                        }}
                                    >
                                        <TrashIcon className="h-3 w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete thread</TooltipContent>
                            </Tooltip>
                        </div>

                        {node.status === "archived" && <ArchiveIcon className="text-muted-foreground h-3 w-3 flex-shrink-0" />}
                    </div>
                </TooltipProvider>

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
                        {node.children.map((child) => renderThreadNode(child))}
                    </div>
                )}
            </div>
        );
    };

    if (!threadHierarchy.length) {
        return (
            <div className="text-muted-foreground px-3 py-8 text-center text-sm">
                <p>No threads yet</p>
                <p className="mt-1 text-xs">Start a new conversation to get started</p>
            </div>
        );
    }

    // Get thread IDs for sortable context
    const threadIds = threadHierarchy.map((thread) => thread.threadId);

    // Use virtual scrolling for large lists
    if (shouldUseVirtualScrolling) {
        return (
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
                                        <SortableThreadItem node={node} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </SortableContext>
            </DndContext>
        );
    }

    // Regular rendering for smaller lists
    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={threadIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                    {threadHierarchy.map((rootNode) => (
                        <SortableThreadItem key={rootNode.threadId} node={rootNode} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
};
