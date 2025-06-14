"use client";

import React, { useState, useCallback } from "react";
import { useThreadContext } from "./thread-context";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GitBranch, Plus, Trash2, GitMerge, MoreHorizontal, MessageSquare, Clock, ChevronRight, ChevronDown, Copy, Edit3 } from "lucide-react";

interface BranchButtonProps {
    messageIndex: number;
    threadId: string;
    onBranchCreated?: (branchId: string) => void;
}

// Button to create a branch from a specific message
export const BranchButton: React.FC<BranchButtonProps> = ({ messageIndex, threadId, onBranchCreated }) => {
    const { createBranch } = useThreadContext();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [branchName, setBranchName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateBranch = useCallback(async () => {
        setIsCreating(true);
        setError(null);

        try {
            const branchId = await createBranch(threadId, messageIndex, branchName || undefined);
            // Note: createBranch now automatically switches to the new branch
            onBranchCreated?.(branchId);
            setIsDialogOpen(false);
            setBranchName("");
        } catch (error) {
            console.error("Failed to create branch:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to create branch";
            setError(errorMessage);
        } finally {
            setIsCreating(false);
        }
    }, [createBranch, threadId, messageIndex, branchName, onBranchCreated]);

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100" title="Create branch from here">
                    <GitBranch className="h-3 w-3" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Branch</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="branch-name" className="text-sm font-medium">
                            Branch Name (optional)
                        </label>
                        <Input
                            id="branch-name"
                            placeholder="Enter branch name..."
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !isCreating) {
                                    handleCreateBranch();
                                }
                            }}
                            disabled={isCreating}
                        />
                    </div>

                    {error && <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{error}</div>}

                    <div className="flex justify-end space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDialogOpen(false);
                                setError(null);
                                setBranchName("");
                            }}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreateBranch} disabled={isCreating}>
                            {isCreating ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <GitBranch className="mr-2 h-4 w-4" />
                                    Create Branch
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

interface MessageWithBranchingProps {
    message: ThreadMessageLike;
    messageIndex: number;
    threadId: string;
    children: React.ReactNode;
}

// Wrapper component that adds branching functionality to messages
export const MessageWithBranching: React.FC<MessageWithBranchingProps> = ({ message, messageIndex, threadId, children }) => {
    return (
        <div className="group relative">
            {children}
            <div className="absolute top-2 right-2 flex items-center space-x-1">
                <BranchButton messageIndex={messageIndex} threadId={threadId} />
            </div>
        </div>
    );
};

interface BranchTreeNodeProps {
    node: any; // BranchNode from thread-context
    isExpanded: boolean;
    onToggle: () => void;
    onSelect: (threadId: string) => void;
    currentThreadId: string;
}

// Individual node in the branch tree visualization
const BranchTreeNode: React.FC<BranchTreeNodeProps> = ({ node, isExpanded, onToggle, onSelect, currentThreadId }) => {
    const { deleteBranch, mergeBranch, getParentThread } = useThreadContext();
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(node.metadata.title);

    const isCurrentThread = node.threadId === currentThreadId;
    const hasChildren = node.children.length > 0;
    const indentLevel = node.depth * 20;

    const handleDelete = useCallback(() => {
        if (confirm(`Are you sure you want to delete "${node.metadata.title}" and all its branches?`)) {
            deleteBranch(node.threadId);
        }
    }, [deleteBranch, node.threadId, node.metadata.title]);

    const handleMerge = useCallback(() => {
        const parentId = getParentThread(node.threadId);
        if (parentId && confirm(`Merge "${node.metadata.title}" back into its parent?`)) {
            mergeBranch(node.threadId, parentId);
        }
    }, [mergeBranch, getParentThread, node.threadId, node.metadata.title]);

    return (
        <div className="select-none">
            <div
                className={`flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100 ${
                    isCurrentThread ? "border-l-2 border-blue-500 bg-blue-100" : ""
                }`}
                style={{ paddingLeft: `${indentLevel + 8}px` }}
                onClick={() => onSelect(node.threadId)}
            >
                {hasChildren && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mr-1 h-4 w-4 p-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle();
                        }}
                    >
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </Button>
                )}

                <GitBranch className="mr-2 h-3 w-3 text-gray-500" />

                <div className="min-w-0 flex-1">
                    {isRenaming ? (
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={() => setIsRenaming(false)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setIsRenaming(false);
                                    // TODO: Implement rename functionality
                                } else if (e.key === "Escape") {
                                    setNewName(node.metadata.title);
                                    setIsRenaming(false);
                                }
                            }}
                            className="h-6 text-xs"
                            autoFocus
                        />
                    ) : (
                        <span className="truncate text-sm">{node.metadata.title}</span>
                    )}
                </div>

                <div className="ml-2 flex items-center space-x-1">
                    {node.metadata.branchName && (
                        <Badge variant="secondary" className="text-xs">
                            {node.metadata.branchName}
                        </Badge>
                    )}

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Clock className="h-3 w-3 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Last activity: {node.metadata.lastActivity.toLocaleString()}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                                <Edit3 className="mr-2 h-3 w-3" />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(node.threadId)}>
                                <Copy className="mr-2 h-3 w-3" />
                                Copy ID
                            </DropdownMenuItem>
                            {node.metadata.parentThreadId && (
                                <DropdownMenuItem onClick={handleMerge}>
                                    <GitMerge className="mr-2 h-3 w-3" />
                                    Merge to Parent
                                </DropdownMenuItem>
                            )}
                            {node.threadId !== "default" && (
                                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                                    <Trash2 className="mr-2 h-3 w-3" />
                                    Delete Branch
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div className="ml-4">
                    {node.children.map((child: any) => (
                        <BranchTreeNode
                            key={child.threadId}
                            node={child}
                            isExpanded={true} // For now, keep all expanded
                            onToggle={() => {}} // TODO: Implement per-node expansion
                            onSelect={onSelect}
                            currentThreadId={currentThreadId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface BranchTreeViewProps {
    className?: string;
}

// Main component for displaying the branch tree
export const BranchTreeView: React.FC<BranchTreeViewProps> = ({ className }) => {
    const { getBranchTree, switchToBranch, currentThreadId, threads } = useThreadContext();
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["default"]));

    const branchTree = getBranchTree();

    const toggleNode = useCallback((nodeId: string) => {
        setExpandedNodes((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    }, []);

    const handleSelectThread = useCallback(
        (threadId: string) => {
            switchToBranch(threadId);
        },
        [switchToBranch],
    );

    if (branchTree.length === 0) {
        return (
            <div className={`p-4 text-center text-gray-500 ${className}`}>
                <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>No conversations yet</p>
            </div>
        );
    }

    return (
        <div className={`space-y-1 ${className}`}>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Conversation Branches</h3>
                <Badge variant="outline" className="text-xs">
                    {threads.size} {threads.size === 1 ? "thread" : "threads"}
                </Badge>
            </div>

            {branchTree.map((rootNode) => (
                <BranchTreeNode
                    key={rootNode.threadId}
                    node={rootNode}
                    isExpanded={expandedNodes.has(rootNode.threadId)}
                    onToggle={() => toggleNode(rootNode.threadId)}
                    onSelect={handleSelectThread}
                    currentThreadId={currentThreadId}
                />
            ))}
        </div>
    );
};

interface BranchNavigationProps {
    className?: string;
}

// Navigation breadcrumb showing the current branch path
export const BranchNavigation: React.FC<BranchNavigationProps> = ({ className }) => {
    const { getThreadPath, threadMetadata, switchToBranch, currentThreadId } = useThreadContext();

    const threadPath = getThreadPath(currentThreadId);

    if (threadPath.length <= 1) {
        return null;
    }

    return (
        <div className={`flex items-center space-x-1 text-sm text-gray-600 ${className}`}>
            <GitBranch className="h-4 w-4" />
            {threadPath.map((threadId, index) => {
                const metadata = threadMetadata.get(threadId);
                const isLast = index === threadPath.length - 1;

                return (
                    <React.Fragment key={threadId}>
                        <button onClick={() => switchToBranch(threadId)} className={`hover:text-blue-600 ${isLast ? "font-medium text-gray-900" : ""}`}>
                            {metadata?.title || threadId}
                        </button>
                        {!isLast && <ChevronRight className="h-3 w-3" />}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

interface BranchStatsProps {
    className?: string;
}

// Component showing statistics about the current branching structure
export const BranchStats: React.FC<BranchStatsProps> = ({ className }) => {
    const { threads, threadMetadata, getBranchSiblings, getChildBranches, currentThreadId } = useThreadContext();

    const currentMetadata = threadMetadata.get(currentThreadId);
    const siblings = getBranchSiblings(currentThreadId);
    const children = getChildBranches(currentThreadId);
    const totalMessages = threads.get(currentThreadId)?.length || 0;

    return (
        <div className={`grid grid-cols-2 gap-4 text-sm ${className}`}>
            <div className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-gray-600">Messages:</span>
                    <span className="font-medium">{totalMessages}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Child Branches:</span>
                    <span className="font-medium">{children.length}</span>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-gray-600">Sibling Branches:</span>
                    <span className="font-medium">{siblings.length}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Total Threads:</span>
                    <span className="font-medium">{threads.size}</span>
                </div>
            </div>
        </div>
    );
};
