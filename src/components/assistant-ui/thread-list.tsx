import type { FC } from "react";
import { ThreadListPrimitive } from "@assistant-ui/react";
import { ArchiveIcon, PlusIcon, TrashIcon, GitBranch, ChevronRight, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { useNavigate } from "@tanstack/react-router";

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

    // Build the hierarchical structure
    const threadHierarchy = useMemo(() => {
        if (!allThreads?.page || !threadRelationships) return [];

        // Create maps for quick lookups
        const threadMap = new Map(allThreads.page.map((thread: any) => [thread._id, thread]));
        const relationshipMap = new Map(threadRelationships.map((rel: any) => [rel.threadId, rel]));

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
            };
        };

        return rootThreads
            .map((thread: any) => buildHierarchy(thread._id))
            .filter((node): node is BranchNode => node !== null)
            .sort((a, b) => b.createdAt - a.createdAt); // Sort by newest first
    }, [allThreads?.page, threadRelationships]);

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

    const renderThreadNode = (node: BranchNode): JSX.Element => {
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
                        {/* Expand/Collapse Button */}
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

                        {/* Branch indicator for child threads */}
                        {!isRootThread && <GitBranch className="text-muted-foreground h-3 w-3 flex-shrink-0" />}

                        {/* Thread Title with Tooltip for truncated text */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="flex-grow cursor-default truncate font-medium">{node.title}</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                                <p className="break-words">{node.title}</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Child count badge */}
                        {hasChildren && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                {node.children.length}
                            </Badge>
                        )}

                        {/* Action buttons - shown on hover */}
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {/* Create Branch */}
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

                            {/* Archive */}
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

                            {/* Delete */}
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

                        {/* Status indicator */}
                        {node.status === "archived" && <ArchiveIcon className="text-muted-foreground h-3 w-3 flex-shrink-0" />}
                    </div>
                </TooltipProvider>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div className="relative">
                        {/* Vertical connection line for children */}
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

    return <div className="space-y-1">{threadHierarchy.map((rootNode) => renderThreadNode(rootNode))}</div>;
};
