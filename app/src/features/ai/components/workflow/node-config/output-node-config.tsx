"use client";

import { Button } from "@anole/ui/components/button";
import { Input } from "@anole/ui/components/input";
import { Label } from "@anole/ui/components/label";
import { useLingui } from "@lingui/react/macro";
import { useReactFlow } from "@xyflow/react";
import { cleanVariableName, generateUniqueKey } from "lib/utils";
import { ChevronDownIcon, PlusIcon, TrashIcon, TriangleAlertIcon, VariableIcon } from "lucide-react";
import { memo, useCallback, useMemo } from "react";

import { findJsonSchemaByPath } from "../../lib/workflow/shared.workflow";
import type { OutputNodeData, UINode } from "../../lib/workflow/workflow.interface";
import { VariableSelect } from "../variable-select";

export const OutputNodeDataConfig = memo(({ data }: { data: OutputNodeData }) => {
    const { getNodes, updateNodeData } = useReactFlow();
    const { t } = useLingui();
    const outputVariables = useMemo(() => {
        const nodes = getNodes() as UINode[];

        return data.outputData.map(({ key, source }) => {
            const targetNode = nodes.find((node) => node.data.id === source?.nodeId);
            const schema = targetNode ? findJsonSchemaByPath(targetNode.data.outputSchema, source?.path ?? []) : undefined;

            return {
                isNotFound: (source && !targetNode) || (targetNode && !schema),
                key,
                nodeId: targetNode?.data.id,
                nodeName: targetNode?.data.name,
                path: source?.path ?? [],
                schema,
            };
        });
    }, [data]);

    const updateOutputVariable = useCallback(
        (index: number, item: { key?: string; source?: { nodeId: string; path: string[] } }) => {
            updateNodeData(data.id, (node) => {
                const previous = node.data as OutputNodeData;

                return {
                    outputData: previous.outputData.map((v, index_) => (index_ === index ? { ...v, ...item } : v)),
                };
            });
        },
        [data.id],
    );
    const deleteOutputVariable = useCallback(
        (index: number) => {
            updateNodeData(data.id, (node) => {
                const previous = node.data as OutputNodeData;

                return {
                    outputData: previous.outputData.filter((_, index_) => index_ !== index),
                };
            });
        },
        [data.id],
    );

    const addOutputVariable = useCallback(
        (key: string = "") => {
            updateNodeData(data.id, (node) => {
                const previous = node.data as OutputNodeData;
                const newKey = generateUniqueKey(
                    key,
                    previous.outputData.map((v) => v.key),
                );

                return {
                    outputData: [...previous.outputData, { key: newKey, source: undefined }],
                };
            });
        },
        [data.id],
    );

    return (
        <div className="flex flex-col gap-2 px-4 text-sm">
            <div className="flex items-center justify-between">
                <Label className="text-sm">{t`Workflow.outputVariables`}</Label>
            </div>
            <div className="flex flex-col gap-2">
                {outputVariables.map((item, index) => (
                    <div className="flex items-center gap-1" key={index}>
                        <Input
                            className="w-24"
                            onChange={(e) => {
                                updateOutputVariable(index, {
                                    key: cleanVariableName(e.target.value),
                                });
                            }}
                            placeholder="name"
                            value={item.key}
                        />
                        <VariableSelect
                            currentNodeId={data.id}
                            onChange={(item) => {
                                updateOutputVariable(index, {
                                    source: {
                                        nodeId: item.nodeId,
                                        path: item.path,
                                    },
                                });
                            }}
                        >
                            <div className="border-input bg-background flex w-full min-w-0 flex-1 cursor-pointer items-center gap-1 rounded-lg border p-2.5 text-[10px]">
                                {item.isNotFound
                                    ? (
                                        <TriangleAlertIcon className="text-destructive size-3" />
                                    )
                                    : (
                                        <VariableIcon className="size-3 text-blue-500" />
                                    )}

                                <span>
                                    {item.nodeName}
                                    /
                                </span>
                                <span className="min-w-0 flex-1 truncate text-blue-500">{item.path.join(".")}</span>
                                <span className="text-muted-foreground">{item.schema?.type}</span>

                                <ChevronDownIcon className="ml-auto size-3" />
                            </div>
                        </VariableSelect>
                        <Button onClick={() => deleteOutputVariable(index)} size="icon" variant="ghost">
                            <TrashIcon />
                        </Button>
                    </div>
                ))}
                <Button
                    className="text-muted-foreground w-full border border-dashed"
                    onClick={() => {
                        addOutputVariable("text");
                    }}
                    variant="ghost"
                >
                    <PlusIcon />
                    {" "}
                    {t`Workflow.addOutputVariable`}
                </Button>
            </div>
        </div>
    );
});
OutputNodeDataConfig.displayName = "OutputNodeDataConfig";

export const OutputNodeDataOutputStack = memo(({ data }: { data: OutputNodeData }) => {
    const { getNodes } = useReactFlow();
    const outputVariables = useMemo(() => {
        const nodes = getNodes() as UINode[];

        return data.outputData.map(({ key, source }) => {
            const targetNode = nodes.find((node) => node.data.id === source?.nodeId);
            const schema = targetNode ? findJsonSchemaByPath(targetNode.data.outputSchema, source?.path ?? []) : undefined;

            return {
                isNotFound: (source && !targetNode) || (targetNode && !schema),
                key,
                nodeId: targetNode?.data.id,
                nodeName: targetNode?.data.name,
                path: source?.path ?? [],
                schema,
            };
        });
    }, [data.outputSchema]);

    if (outputVariables.length === 0)
        return null;

    return (
        <div className="mt-4 flex flex-col gap-1 px-4">
            {outputVariables.map((item, index) => (
                <div className="bg-input flex items-center gap-1 rounded border px-2 py-1 text-[10px]" key={index}>
                    <div className="flex w-full min-w-0 flex-1 items-center gap-1">
                        {item.isNotFound ? <TriangleAlertIcon className="text-destructive size-3" /> : <VariableIcon className="size-3 text-blue-500" />}

                        <span>
                            {item.nodeName}
                            /
                        </span>
                        <span className="min-w-0 flex-1 truncate text-blue-500">{item.path.join(".")}</span>
                        <span className="text-muted-foreground">{item.schema?.type}</span>
                    </div>
                </div>
            ))}
        </div>
    );
});
OutputNodeDataOutputStack.displayName = "OutputNodeDataOutputStack";
