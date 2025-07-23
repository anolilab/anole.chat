"use client";

import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@anole/ui/components/context-menu";
import cn from "@anole/ui/utils/cn";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Loader2Icon, PlusIcon, TriangleAlertIcon } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";

import { useUpdate } from "@/hooks/use-update";

import type { UINode } from "../../lib/workflow/workflow.interface";
import { NodeKind } from "../../lib/workflow/workflow.interface";
import { Markdown } from "../markdown";
import { createAppendNode } from "./create-append-node";
import { ConditionNodeDataOutputStack } from "./node-config/condition-node-config";
import { HttpNodeDataStack } from "./node-config/http-node-config";
import { OutputSchemaStack } from "./node-config/input-node-config";
import { LLMNodeDataStack } from "./node-config/llm-node-config";
import { OutputNodeDataOutputStack } from "./node-config/output-node-config";
import { ToolNodeStack } from "./node-config/tool-node-config";
import { NodeContextMenuContent } from "./node-context-menu-content";
import { NodeIcon } from "./node-icon";
import { NodeSelect } from "./node-select";

type Properties = NodeProps<UINode>;

export const DefaultNode = memo(({ data, id, isConnectable, selected }: Properties) => {
    const [openNodeSelect, setOpenNodeSelect] = useState(false);

    const { addEdges, addNodes, fitView, getEdges, getNode, getNodes, updateNode } = useReactFlow();
    const update = useUpdate();

    const appendNode = useCallback(
        (kind: NodeKind) => {
            setOpenNodeSelect(false);
            const edges = getEdges();
            const nodes = getNodes() as UINode[];

            const { edge: newEdge, node: newNode } = createAppendNode({
                allEdges: edges,
                allNodes: nodes,
                kind,
                sourceNode: getNode(data.id)! as UINode,
            });

            addNodes([newNode]);

            if (newEdge) {
                addEdges([newEdge]);
            }

            update(() => {
                updateNode(id, {
                    selected: false,
                });
            });
        },
        [id, addNodes],
    );

    useEffect(() => {
        if (data.runtime?.isNew) {
            updateNode(id, {
                selected: true,
            });
            const node = getNode(id)!;

            if (node) {
                fitView({
                    duration: 500,
                    maxZoom: 1.2,
                    nodes: [node],
                });
            }
        }
    }, [id]);

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div
                    className={cn(
                        "fade-300 group bg-secondary hover:bg-input relative flex w-72 cursor-grab flex-col rounded-lg border-2 py-4 transition-colors",
                        data.kind === NodeKind.Note && "bg-card/40 text-primary border-input min-h-40 w-md rounded-none",
                        data.kind === NodeKind.Condition && "w-52",
                        data.kind !== NodeKind.Note && selected && "bg-secondary! border-blue-500",
                        data.runtime?.status === "fail" && "border-destructive",
                        ["running", "success"].includes(data.runtime?.status ?? "") && "border-green-400",
                    )}
                >
                    <div className="relative flex items-center gap-2 px-4">
                        {![NodeKind.Input, NodeKind.Note].includes(data.kind) && (
                            <Handle
                                className={cn(
                                    "-left-[4px]! h-4! w-[1px]! rounded-l-xs! rounded-r-none! border-none! bg-blue-500!",
                                    data.runtime?.status === "fail" && "bg-destructive!",
                                    ["running", "success"].includes(data.runtime?.status ?? "") && "bg-green-400!",
                                )}
                                id="left"
                                isConnectable={isConnectable}
                                position={Position.Left}
                                type="target"
                            />
                        )}
                        <NodeIcon type={data.kind} />
                        <div className="truncate font-bold">{data.name}</div>
                        {![NodeKind.Condition, NodeKind.Note, NodeKind.Output].includes(data.kind) && (
                            <Handle
                                className="-right-0! z-10 h-4! w-4! border-none! bg-transparent!"
                                id="right"
                                isConnectable={isConnectable}
                                onConnect={() => update()}
                                onMouseUp={() => {
                                    setOpenNodeSelect(true);
                                }}
                                position={Position.Right}
                                type="source"
                            >
                                <div className="pointer-events-none relative">
                                    <div className={cn("z-20 flex h-full w-full pl-2.5", "group-hover:hidden", selected && "hidden")}>
                                        <div
                                            className={cn(
                                                "h-4 w-1.5 rounded-r-xs bg-blue-500",
                                                data.runtime?.status === "fail" && "bg-destructive",
                                                ["running", "success"].includes(data.runtime?.status ?? "") && "bg-green-400",
                                            )}
                                        />
                                    </div>
                                    <NodeSelect
                                        onChange={appendNode}
                                        onOpenChange={(open) => {
                                            setOpenNodeSelect(open);
                                        }}
                                        open={openNodeSelect}
                                    >
                                        <div
                                            className={cn(
                                                "translate-x hidden h-5 w-5 -translate-y-0.5 items-center justify-center rounded-full bg-blue-500",
                                                "group-hover:flex",
                                                selected && "flex",
                                            )}
                                        >
                                            <PlusIcon className="size-4 stroke-4 text-white" />
                                        </div>
                                    </NodeSelect>
                                </div>
                            </Handle>
                        )}
                        {data.runtime?.status === "fail"
                            ? (
                                <div className="ml-auto">
                                    <TriangleAlertIcon className="text-destructive size-3" />
                                </div>
                            )
                            : data.runtime?.status === "running"
                                ? (
                                    <div className="ml-auto">
                                        <Loader2Icon className="size-3 animate-spin" />
                                    </div>
                                )
                                : null}
                    </div>
                    <div>
                        {data.kind === NodeKind.Input && <OutputSchemaStack data={data} />}
                        {data.kind === NodeKind.Output && <OutputNodeDataOutputStack data={data} />}
                        {data.kind === NodeKind.LLM && <LLMNodeDataStack data={data} />}
                        {data.kind === NodeKind.Condition && <ConditionNodeDataOutputStack data={data} />}
                        {data.kind === NodeKind.Tool && <ToolNodeStack data={data} />}
                        {data.kind === NodeKind.Http && <HttpNodeDataStack data={data} />}
                        {data.description && (
                            <div className="mt-2 px-4">
                                <div className="text-muted-foreground text-xs">
                                    {data.kind === NodeKind.Note
                                        ? (
                                            <Markdown>{data.description}</Markdown>
                                        )
                                        : (
                                            <p className="text-foreground mt-4 text-sm break-all whitespace-pre-wrap">{data.description}</p>
                                        )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="p-2">
                <NodeContextMenuContent node={data} />
            </ContextMenuContent>
        </ContextMenu>
    );
});
