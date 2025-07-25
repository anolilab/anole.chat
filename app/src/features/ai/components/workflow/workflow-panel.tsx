"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@anole/ui/components/avatar";
import { Button } from "@anole/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@anole/ui/components/dropdown-menu";
import { handleErrorWithToast } from "@anole/ui/components/shared-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import { useLingui } from "@lingui/react/macro";
import { useReactFlow } from "@xyflow/react";
import equal from "fast-deep-equal";
import { AlignHorizontalSpaceAround, BlocksIcon, Check, EyeIcon, Loader, LockIcon, PlayIcon } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

import { Separator } from "@/components/ui/separator";
import { safe } from "@/lib/safe-async";
import type { DBWorkflow } from "@anole/ui/components/avatar";

import { arrangeNodes } from "../../lib/workflow/arrange-nodes";
import { allNodeValidate } from "../../lib/workflow/node-validate";
import type { UINode } from "../../lib/workflow/workflow.interface";
import { ExecuteTab } from "./node-config/execute-tab";
import { SelectedNodeConfigTab } from "./selected-node-config-tab";

export const WorkflowPanel = memo(
    ({
        addProcess,
        hasEditAccess,
        isProcessing,
        onSave,
        selectedNode,
        workflow,
    }: {
        addProcess: () => () => void;
        hasEditAccess?: boolean;
        isProcessing: boolean;
        onSave: () => Promise<void>;
        selectedNode?: UINode;
        workflow: DBWorkflow;
    }) => {
        const { getEdges, getNodes, setNodes } = useReactFlow();
        const [showExecutePanel, setShowExecutePanel] = useState(false);
        const { t } = useLingui();

        const handleArrangeNodes = useCallback(() => {
            const nodes = getNodes() as UINode[];
            const edges = getEdges();

            const { nodes: arrangedNodes } = arrangeNodes(nodes, edges);

            setNodes(arrangedNodes);
            toast.success(t`Layout applied successfully`);
        }, [getNodes, getEdges, setNodes, t]);
        const updateVisibility = useCallback(
            (visibility: DBWorkflow["visibility"]) => {
                const close = addProcess();

                safe(() =>
                    fetch("/api/workflow", {
                        body: JSON.stringify({
                            ...workflow,
                            visibility,
                        }),
                        method: "POST",
                    }).then((res) => {
                        if (res.status !== 200)
                            throw new Error(res.statusText);
                    }),
                )
                    .ifOk(() => mutate(`/api/workflow/${workflow.id}`))
                    .ifFail((e) => handleErrorWithToast(e))
                    .watch(close);
            },
            [workflow],
        );

        const updatePublished = useCallback(
            (isPublished: boolean) => {
                if (isPublished) {
                    const validateResult = allNodeValidate({
                        edges: getEdges(),
                        nodes: getNodes() as UINode[],
                    });

                    if (validateResult !== true) {
                        if (validateResult.node) {
                            setNodes((nds) =>
                                nds.map((node) => {
                                    if (node.id === validateResult.node?.id) {
                                        return { ...node, selected: true };
                                    }

                                    if (node.selected) {
                                        return { ...node, selected: false };
                                    }

                                    return node;
                                }),
                            );
                        }

                        return toast.warning(validateResult.errorMessage);
                    }
                }

                const close = addProcess();

                safe(() => onSave())
                    .ifOk(() =>
                        fetch("/api/workflow", {
                            body: JSON.stringify({
                                ...workflow,
                                isPublished,
                            }),
                            method: "POST",
                        }).then((res) => {
                            if (res.status !== 200)
                                throw new Error(res.statusText);
                        }),
                    )
                    .ifOk(() => mutate(`/api/workflow/${workflow.id}`))
                    .ifFail((e) => handleErrorWithToast(e))
                    .watch(close);
            },
            [workflow],
        );

        return (
            <div className="flex min-h-0 flex-col items-end">
                <div className="mb-2 flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="hover:bg-secondary! group ring-background hover:ring-ring flex h-8 w-8 items-center justify-center rounded-md border ring transition-colors"
                                style={{
                                    backgroundColor: workflow.icon?.style?.backgroundColor,
                                }}
                            >
                                <Avatar className="size-6">
                                    <AvatarImage className="transition-transform group-hover:scale-110" src={workflow.icon?.value} />
                                    <AvatarFallback />
                                </Avatar>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>{workflow?.name}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button disabled={isProcessing || !hasEditAccess} onClick={handleArrangeNodes} size="icon" variant="secondary">
                                <AlignHorizontalSpaceAround className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>{t`Auto Layout`}</p>
                        </TooltipContent>
                    </Tooltip>
                    <div className="h-6">
                        <Separator orientation="vertical" />
                    </div>
                    <Button
                        disabled={isProcessing}
                        onClick={() => {
                            setNodes((nds) =>
                                nds.map((node) => {
                                    if (node.selected) {
                                        return { ...node, selected: false };
                                    }

                                    return node;
                                }),
                            );
                            setShowExecutePanel(!showExecutePanel);
                        }}
                        variant="secondary"
                    >
                        <PlayIcon />
                        {t`Run`}
                    </Button>

                    {!workflow.isPublished && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button disabled={isProcessing || !hasEditAccess} onClick={onSave} variant="default">
                                    {isProcessing ? <Loader className="size-3.5 animate-spin" /> : t`Save`}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">{t`Workflow.autoSaveDescription`}</TooltipContent>
                        </Tooltip>
                    )}
                    <div className="h-6">
                        <Separator orientation="vertical" />
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                className="w-20"
                                disabled={isProcessing || !hasEditAccess}
                                onClick={() => updatePublished(!workflow.isPublished)}
                                variant="secondary"
                            >
                                {workflow.isPublished ? t`Edit` : t`Publish`}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent align="end" className="w-60 text-sm" side="bottom">
                            <p className="p-4 break-words whitespace-pre-wrap">
                                {workflow.isPublished ? t`Published Description` : t`Draft Description`}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                    <DropdownMenu>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button className="data-[state=open]:bg-input!" size="icon" variant="secondary">
                                        {workflow.visibility === "public" ? <BlocksIcon /> : workflow.visibility === "readonly" ? <EyeIcon /> : <LockIcon />}
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">{t`Control who can access and modify this workflow`}</TooltipContent>
                        </Tooltip>

                        <DropdownMenuContent align="end" side="bottom">
                            {[
                                {
                                    description: "Workflow.privateDescription",
                                    icon: <LockIcon />,
                                    label: "Workflow.private",
                                    value: "private",
                                },
                                {
                                    description: "Workflow.readonlyDescription",
                                    icon: <EyeIcon />,
                                    label: "Workflow.readonly",
                                    value: "readonly",
                                },
                                {
                                    description: "Workflow.publicDescription",
                                    icon: <BlocksIcon />,
                                    label: "Workflow.public",
                                    value: "public",
                                },
                            ].map((item) => (
                                <DropdownMenuItem
                                    className="cursor-pointer"
                                    disabled={workflow.visibility === item.value || !hasEditAccess}
                                    key={item.value}
                                    onClick={() => updateVisibility(item.value as DBWorkflow["visibility"])}
                                >
                                    {item.icon}
                                    <div className="flex flex-col gap-1 px-4">
                                        <p>{t(item.label)}</p>
                                        <p className="text-muted-foreground text-xs">{t(item.description)}</p>
                                    </div>
                                    {workflow.visibility === item.value && <Check className="ml-auto" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex gap-2">
                    {selectedNode && <SelectedNodeConfigTab node={selectedNode} />}
                    {showExecutePanel && (
                        <ExecuteTab
                            close={() => {
                                if (isProcessing)
                                    return;

                                setShowExecutePanel(false);
                            }}
                            onSave={onSave}
                        />
                    )}
                </div>
            </div>
        );
    },
    (previous, next) => {
        if (previous.isProcessing !== next.isProcessing) {
            return false;
        }

        if (Boolean(previous.selectedNode) !== Boolean(next.selectedNode)) {
            return false;
        }

        if (previous.hasEditAccess !== next.hasEditAccess) {
            return false;
        }

        if (!equal(previous.selectedNode?.data, next.selectedNode?.data)) {
            return false;
        }

        if (!equal(previous.workflow, next.workflow))
            return false;

        return true;
    },
);
