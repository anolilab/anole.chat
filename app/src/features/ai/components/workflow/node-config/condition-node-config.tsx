"use client";

import { Badge } from "@anole/ui/components/badge";
import { Button } from "@anole/ui/components/button";
import { Input } from "@anole/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@anole/ui/components/select";
import { Separator } from "@anole/ui/components/separator";
import { useLingui } from "@lingui/react/macro";
import { Handle, Position, useNodes, useReactFlow } from "@xyflow/react";
import { cn } from "lib/utils";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { useUpdate } from "@/hooks/use-update";

import type { ConditionBranch, ConditionOperator, ConditionRule } from "../../lib/workflow/condition";
import { BooleanConditionOperator, getFirstConditionOperator, NumberConditionOperator, StringConditionOperator } from "../../lib/workflow/condition";
import { findJsonSchemaByPath } from "../../lib/workflow/shared.workflow";
import type { ConditionNodeData, NodeKind, OutputSchemaSourceKey, UINode } from "../../lib/workflow/workflow.interface";
import { createAppendNode } from "../create-append-node";
import { NodeSelect } from "../node-select";
import { VariableMentionItem } from "../variable-mention-item";
import { VariableSelect } from "../variable-select";

export const ConditionNodeDataConfig = ({ data }: { data: ConditionNodeData }) => {
    const { t } = useLingui();
    const { getEdges, setEdges, updateNodeData } = useReactFlow();

    const updateIfBranch = useCallback(
        (branch: ConditionBranch) => {
            updateNodeData(data.id, (node) => {
                const previous = node.data as ConditionNodeData;

                return {
                    branches: { ...previous.branches, if: branch },
                };
            });
        },
        [data.id],
    );

    const updateElseIfBranch = useCallback(
        (index: number, branch: ConditionBranch) => {
            updateNodeData(data.id, (node) => {
                const previous = node.data as ConditionNodeData;

                return {
                    branches: {
                        ...previous.branches,
                        elseIf: previous.branches.elseIf?.map((item, index_) => (index_ === index ? branch : item)) ?? [branch],
                    },
                };
            });
        },
        [data.id],
    );

    const addElseIfBranch = useCallback(() => {
        updateNodeData(data.id, (node) => {
            const previous = node.data as ConditionNodeData;

            return {
                branches: {
                    ...previous.branches,
                    elseIf: [
                        ...previous.branches.elseIf ?? [],
                        {
                            conditions: [],
                            id: uuidv4(),
                            logicalOperator: "AND",
                            type: "elseIf",
                        },
                    ],
                },
            };
        });
    }, [data.id]);

    const removeElseIfBranch = useCallback(
        (index: number) => {
            const edges = getEdges();
            const connectedEdges = edges.filter((edge) => edge.sourceHandle === data.branches.elseIf![index].id).map((edge) => edge.id);

            if (connectedEdges.length > 0) {
                setEdges(edges.filter((edge) => !connectedEdges.includes(edge.id)));
            }

            updateNodeData(data.id, (node) => {
                const previous = node.data as ConditionNodeData;

                return {
                    branches: {
                        ...previous.branches,
                        elseIf: previous.branches.elseIf?.filter((_, index_) => index_ !== index),
                    },
                };
            });
        },
        [data.id, data.branches.elseIf?.length],
    );

    return (
        <div className="flex h-full flex-col gap-2 text-sm">
            <div className="flex flex-col gap-2 px-4">
                <ConditionBranchItem branch={data.branches.if} caseNumber={1} currentNodeId={data.id} onChange={updateIfBranch} type="if" />
            </div>
            <Separator className="my-2" />
            <div className="flex flex-col gap-2 px-4">
                {!data.branches.elseIf?.length && (
                    <>
                        <p className="mb-2 text-xs font-bold text-blue-500">ELSE IF</p>
                        <p className="text-muted-foreground ml-12 text-xs">{t`If the condition is not met, the logic to be executed is defined.`}</p>
                    </>
                )}
                <div className="flex flex-col">
                    {data.branches.elseIf?.map((branch, index) => (
                        <div key={index}>
                            {index > 0 && <Separator className="my-2" />}
                            <ConditionBranchItem
                                branch={branch}
                                caseNumber={index + 2}
                                currentNodeId={data.id}
                                onChange={(branch) => updateElseIfBranch(index, branch)}
                                onDelete={() => removeElseIfBranch(index)}
                                type="else If"
                            />
                        </div>
                    ))}
                </div>
                <Button className="w-full" onClick={addElseIfBranch} variant="secondary">
                    <PlusIcon className="size-4" />
                    ELSE IF
                </Button>
            </div>
            <Separator className="my-2" />
            <div className="px-4">
                <div className="mb-2 flex text-xs font-bold">
                    <p className="w-12 text-blue-500">ELSE</p>
                    <span className="text-muted-foreground ml-1">
                        CASE
                        {(data.branches.elseIf?.length ?? 0) + 2}
                    </span>
                </div>
                <p className="text-muted-foreground ml-12 text-xs">{t`If the condition is not met, the logic to be executed is defined.`}</p>
            </div>
        </div>
    );
};
ConditionNodeDataConfig.displayName = "ConditionNodeDataConfig";

interface ConditionBranchProperties {
    branch: ConditionBranch;
    caseNumber: number;
    currentNodeId: string;
    onChange: (branch: ConditionBranch) => void;
    onDelete?: () => void;
    type: "if" | "else If" | "else";
}

const ConditionBranchItem = ({ branch, caseNumber, currentNodeId, onChange, onDelete, type }: ConditionBranchProperties) => {
    const { getNode } = useReactFlow<UINode>();
    const nodes = useNodes() as UINode[];
    const { t } = useLingui();
    const addCondition = useCallback(
        (source: OutputSchemaSourceKey) => {
            const node = getNode(source.nodeId)!;

            const sourceSchema = findJsonSchemaByPath(node.data.outputSchema, source.path);

            onChange({
                ...branch,
                conditions: [
                    ...branch.conditions,
                    {
                        operator: getFirstConditionOperator(sourceSchema?.type as "string" | "number" | "boolean"),
                        source,
                        value: "",
                    },
                ],
            });
        },
        [branch, onChange],
    );

    const updateCondition = useCallback(
        (index: number, condition: ConditionRule) => {
            onChange({
                ...branch,
                conditions: branch.conditions.map((item, index_) => (index_ === index ? condition : item)),
            });
        },
        [branch, onChange],
    );

    const removeCondition = useCallback(
        (index: number) => {
            onChange({
                ...branch,
                conditions: branch.conditions.filter((_, index_) => index_ !== index),
            });
        },
        [branch, onChange],
    );

    return (
        <div className="relative flex flex-col gap-1">
            <div className="mb-2 flex text-xs font-bold">
                <p className="w-12 text-blue-500">{type?.toUpperCase()}</p>
                <span className="text-muted-foreground ml-1">
                    CASE
                    {caseNumber}
                </span>
            </div>
            {branch.conditions.length > 0 && (
                <div className="flex">
                    <div className="flex min-w-12 flex-col">
                        {branch.conditions.length > 1 && (
                            <>
                                <div className="flex w-full flex-1 items-end justify-end">
                                    <div className="h-[calc(100%-1rem)] w-1/2 rounded-tl-full border-t border-l border-dashed" />
                                </div>
                                <div className="my-1 pr-1 text-center text-xs">
                                    <button
                                        className="hover:bg-secondary hover:text-foreground bg-primary text-primary-foreground w-11 rounded-md px-2 py-1"
                                        onClick={() =>
                                            onChange({
                                                ...branch,
                                                logicalOperator: branch.logicalOperator === "AND" ? "OR" : "AND",
                                            })}
                                    >
                                        {branch.logicalOperator}
                                    </button>
                                </div>
                                <div className="flex w-full flex-1 items-start justify-end">
                                    <div className="h-[calc(100%-1rem)] w-1/2 rounded-bl-full border-b border-l border-dashed" />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        {branch.conditions.map((condition, index) => (
                            <div className="flex" key={index}>
                                <div className="flex-1">
                                    <ConditionRuleItem
                                        currentNodeId={currentNodeId}
                                        item={condition}
                                        nodes={nodes}
                                        onChange={(condition) => updateCondition(index, condition)}
                                    />
                                </div>
                                <div className="px-1">
                                    <Button onClick={() => removeCondition(index)} size="icon" variant="ghost">
                                        <TrashIcon className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center">
                <VariableSelect
                    allowedTypes={["number", "boolean", "string"]}
                    currentNodeId={currentNodeId}
                    onChange={(source) => {
                        addCondition(source);
                    }}
                >
                    <Badge className="hover:bg-input ml-12 cursor-pointer px-4 py-2" variant="secondary">
                        <PlusIcon className="size-4" />
                        {" "}
                        {t`Add Condition`}
                    </Badge>
                </VariableSelect>

                {onDelete && (
                    <Button className="mr-7 ml-auto text-xs" onClick={onDelete} variant="ghost">
                        <TrashIcon className="size-3.5" />
                        {t`Delete`}
                    </Button>
                )}
            </div>
        </div>
    );
};

interface ConditionRuleProperties {
    currentNodeId: string;
    item: ConditionRule;
    nodes: UINode[];
    onChange: (item: ConditionRule) => void;
}

const ConditionRuleItem = ({ currentNodeId, item, nodes, onChange }: ConditionRuleProperties) => {
    const target = useMemo(() => {
        const node = nodes.find((node) => node.data.id === item.source.nodeId);

        if (!node) {
            return {
                nodeName: "Not Found",
                notFound: true,
                path: item.source.path,
            };
        }

        return {
            nodeName: node.data.name,
            path: item.source.path,
        };
    }, [item, nodes]);

    const itemType = useMemo(() => {
        const node = nodes.find((node) => node.data.id === item.source.nodeId);

        if (!node) {
            return "string";
        }

        return findJsonSchemaByPath(node.data.outputSchema, item.source.path)?.type;
    }, [item, nodes]);

    const operatorItems = useMemo(() => {
        let operatorItems: Record<string, string> = StringConditionOperator;

        if (itemType === "number")
            operatorItems = NumberConditionOperator;

        if (itemType === "boolean")
            operatorItems = BooleanConditionOperator;

        return Object.entries(operatorItems).map(([key, value]) => {
            return {
                label: key,
                value,
            };
        });
    }, [itemType]);

    return (
        <div className="bg-secondary flex flex-col rounded-lg p-1">
            <div className="flex items-center">
                <VariableSelect
                    currentNodeId={currentNodeId}
                    onChange={(source) => {
                        onChange({
                            ...item,
                            source,
                        });
                    }}
                >
                    <div>
                        <VariableMentionItem className="w-38 max-w-38 py-2" nodeName={target.nodeName} path={target.path} type={itemType as string} />
                    </div>
                </VariableSelect>
                <div className="ml-auto h-4 px-2">
                    <Separator orientation="vertical" />
                </div>
                <Select
                    defaultValue={item.operator}
                    onValueChange={(value) =>
                        onChange({
                            ...item,
                            operator: value as ConditionOperator,
                            value: undefined,
                        })}
                >
                    <SelectTrigger className="w-24 border-none text-xs">
                        <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                        {operatorItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {itemType === "string" || itemType === "number"
                ? (
                    <>
                        <Separator className="my-1" />
                        <Input
                            autoFocus
                            className="border-none bg-transparent px-2 py-1 text-xs focus:outline-none"
                            onChange={(e) => onChange({ ...item, value: e.target.value })}
                            type="text"
                            value={String(item.value || "")}
                        />
                    </>
                )
                : null}
        </div>
    );
};

export const ConditionNodeDataOutputStack = ({ data }: { data: ConditionNodeData }) => {
    const [sourceHandle, setSourceHandle] = useState("");

    const update = useUpdate();

    const { addEdges, addNodes, getEdges, getNodes, updateNode } = useReactFlow();

    const appendNode = (kind: NodeKind) => {
        if (!sourceHandle)
            return;

        setSourceHandle("");
        const allNodes = getNodes() as UINode[];
        const { edge: newEdge, node: newNode } = createAppendNode({
            allEdges: getEdges(),
            allNodes,
            edge: {
                sourceHandle,
            },
            kind,
            sourceNode: allNodes.find((node) => node.data.id === data.id)!,
        });

        addNodes([newNode]);

        if (newEdge) {
            addEdges([newEdge]);
        }

        update(() => {
            updateNode(data.id, {
                selected: false,
            });
        });
    };

    return (
        <div className="mt-2">
            <div className="flex flex-col gap-2">
                <ConditionHandle
                    caseNumber={1}
                    id={data.branches.if.id}
                    onMouseUp={() => {
                        setSourceHandle(data.branches.if.id);
                    }}
                    type="if"
                />
                <NodeSelect
                    onChange={appendNode}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSourceHandle("");
                        }
                    }}
                    open={Boolean(sourceHandle)}
                >
                    <PlusIcon className="sr-only" />
                </NodeSelect>

                {data.branches.elseIf?.map((branch, index) => (
                    <ConditionHandle
                        caseNumber={index + 2}
                        id={branch.id}
                        key={branch.id}
                        onMouseUp={() => {
                            setSourceHandle(branch.id);
                        }}
                        type="elseIf"
                    />
                ))}
                <ConditionHandle
                    caseNumber={(data.branches.elseIf?.length ?? 0) + 2}
                    id={data.branches.else.id}
                    onMouseUp={() => {
                        setSourceHandle(data.branches.else.id);
                    }}
                    type="else"
                />
            </div>
        </div>
    );
};

const ConditionHandle = ({ caseNumber, id, onMouseUp, type }: { caseNumber?: number; id: string; onMouseUp?: () => void; type: "if" | "elseIf" | "else" }) => (
    <div className="relative">
        <Handle
            className="-right-0! z-10 flex h-5! w-5! items-center justify-center rounded-full! border-none! bg-blue-500!"
            id={id}
            isConnectable
            onMouseUp={onMouseUp}
            position={Position.Right}
            type="source"
        >
            <div className="pointer-events-none">
                <PlusIcon className="size-4 stroke-4 text-white" />
            </div>
        </Handle>
        <div className="px-4">
            <div className="bg-input flex w-full rounded-xs border px-2 py-1 text-xs font-bold">
                <span className="text-blue-500">{type.toUpperCase()}</span>
                {caseNumber && (
                    <span className="text-muted-foreground ml-auto">
                        CASE
                        {caseNumber}
                    </span>
                )}
            </div>
        </div>
    </div>
);
