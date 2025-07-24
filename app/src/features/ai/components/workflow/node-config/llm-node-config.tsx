import { Button } from "@anole/ui/components/button";
import { Label } from "@anole/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@anole/ui/components/select";
import { Separator } from "@anole/ui/components/separator";
import { Switch } from "@anole/ui/components/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import { useLingui } from "@lingui/react/macro";
import type { Edge } from "@xyflow/react";
import { useEdges, useNodes, useReactFlow } from "@xyflow/react";
import { notify } from "lib/notify";
import { ChevronDown, InfoIcon, MessageCirclePlusIcon, TrashIcon, VariableIcon } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { useWorkflowStore } from "@/app/store/workflow.store";
import type { ObjectJsonSchema7 } from "@/types/util";

import { defaultLLMNodeOutputSchema } from "../../lib/workflow/create-ui-node";
import type { LLMNodeData, UINode } from "../../lib/workflow/workflow.interface";
import { SelectModel } from "../../select-model";
import { appStore } from "../../store";
import { OutputSchemaEditor } from "../output-schema-editor";
import { OutputSchemaMentionInput } from "../output-schema-mention-input";

export const LLMNodeDataConfig = memo(({ data }: { data: LLMNodeData }) => {
    const { updateNodeData } = useReactFlow<UINode>();
    const [structuredOutputOpen, setStructuredOutputOpen] = useState(false);
    const { t } = useLingui();
    const editable = useWorkflowStore((state) => state.processIds.length === 0 && state.hasEditAccess && !state.workflow?.isPublished);

    const nodes = useNodes() as UINode[];
    const edges = useEdges() as Edge[];

    const model = useMemo(() => data.model || appStore.getState().chatModel!, [data.model]);

    const updateMessage = useCallback(
        (index: number, message: Partial<LLMNodeData["messages"][number]>) => {
            updateNodeData(data.id, (node) => {
                const previous = node.data as LLMNodeData;

                return {
                    messages: previous.messages.map((m, index_) => {
                        if (index_ !== index)
                            return m;

                        return { ...m, ...message };
                    }),
                };
            });
        },
        [data.id],
    );

    const removeMessage = useCallback(
        (index: number) => {
            updateNodeData(data.id, (node) => {
                const previous = node.data as LLMNodeData;

                return {
                    messages: previous.messages.filter((_, index_) => index_ !== index),
                };
            });
        },
        [data.id],
    );

    const addMessage = useCallback(() => {
        updateNodeData(data.id, (node) => {
            const previous = node.data as LLMNodeData;

            return {
                messages: [...previous.messages, { role: "user" }],
            };
        });
    }, [data.id]);

    useEffect(() => {
        if (!data.model) {
            updateNodeData(data.id, {
                model: appStore.getState().chatModel!,
            });
        }
    }, []);

    const isStructuredOutput = useMemo(() => data.outputSchema.properties?.answer?.type !== "string", [data.outputSchema]);

    return (
        <div className="flex h-full flex-col gap-2 px-4 text-sm">
            <Label className="text-sm">Model</Label>
            <SelectModel
                defaultModel={model}
                onSelect={(model) => {
                    updateNodeData(data.id, {
                        model,
                    });
                }}
            >
                <Button className="data-[state=open]:bg-input! hover:bg-input! w-full" variant="outline">
                    <p className="mr-auto">{model?.model ?? <span className="text-muted-foreground">model</span>}</p>
                    <ChevronDown className="size-3" />
                </Button>
            </SelectModel>

            <div className="flex items-center justify-between">
                <Label className="text-sm">
                    LLM
                    {t`Workflow.outputSchema`}
                </Label>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                            <Label className="text-muted-foreground text-xs font-normal" htmlFor="structuredOutput">
                                {t`Workflow.structuredOutput`}
                            </Label>
                            <Switch
                                checked={isStructuredOutput}
                                id="structuredOutput"
                                onClick={async () => {
                                    if (isStructuredOutput) {
                                        const ok = await notify.confirm({
                                            cancelText: t`Workflow.structuredOutputSwitchConfirmCancel`,
                                            description: t`Workflow.structuredOutputSwitchConfirm`,
                                            okText: t`Workflow.structuredOutputSwitchConfirmOk`,
                                        });

                                        if (!ok) {
                                            return updateNodeData(data.id, {
                                                outputSchema: structuredClone(defaultLLMNodeOutputSchema),
                                            });
                                        }
                                    }

                                    setStructuredOutputOpen(true);
                                }}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-4 whitespace-pre-wrap">{t`Workflow.structuredOutputDescription`}</TooltipContent>
                </Tooltip>
            </div>
            <div className="flex flex-wrap items-center gap-1">
                {Object.keys(data.outputSchema.properties).flatMap((key) => {
                    if (key === "answer" && data.outputSchema.properties[key].type === "object") {
                        return Object.keys(data.outputSchema.properties[key].properties ?? {}).map((property) => (
                            <div className="bg-secondary flex items-center rounded-md px-1.5 py-0.5 text-xs" key={`${key}.${property}`}>
                                <VariableIcon className="size-3.5 text-blue-500" />
                                <span className="font-semibold">{`${key}.${property}`}</span>
                                <span className="text-muted-foreground ml-2">{data.outputSchema.properties[key].properties![property]?.type}</span>
                            </div>
                        ));
                    }

                    return [
                        <div className="bg-secondary flex items-center rounded-md px-1.5 py-0.5 text-xs" key={key}>
                            <VariableIcon className="size-3.5 text-blue-500" />
                            <span className="font-semibold">{key}</span>
                            <span className="text-muted-foreground ml-2">{data.outputSchema.properties[key].type}</span>
                        </div>,
                    ];
                })}
            </div>

            <Separator className="my-4" />
            <div className="flex items-center justify-between">
                <Label className="mt-1 text-sm">Messages</Label>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="hover:bg-secondary cursor-pointer rounded p-1">
                            <InfoIcon className="size-3" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-4 whitespace-pre-wrap">{t`Workflow.messagesDescription`}</TooltipContent>
                </Tooltip>
            </div>
            <div className="flex flex-col gap-2">
                {data.messages.map((message, index) => (
                    <div className="bg-secondary w-full rounded-md p-2" key={index}>
                        <div className="flex items-center gap-2">
                            <Select
                                onValueChange={(value) => {
                                    updateMessage(index, {
                                        role: value as "user" | "assistant" | "system",
                                    });
                                }}
                                value={message.role}
                            >
                                <SelectTrigger className="border-none" size="sm">
                                    {message.role.toUpperCase()}
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">USER</SelectItem>
                                    <SelectItem value="assistant">ASSISTANT</SelectItem>
                                    <SelectItem value="system">SYSTEM</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                className="hover:bg-destructive/10! hover:text-destructive ml-auto size-7"
                                onClick={() => removeMessage(index)}
                                size="icon"
                                variant="ghost"
                            >
                                <TrashIcon className="hover:text-destructive size-3" />
                            </Button>
                        </div>
                        <OutputSchemaMentionInput
                            content={message.content}
                            currentNodeId={data.id}
                            edges={edges}
                            editable={editable}
                            nodes={nodes}
                            onChange={(content) => {
                                updateMessage(index, {
                                    content,
                                });
                            }}
                        />
                    </div>
                ))}

                <Button className="text-muted-foreground mt-1 w-full border border-dashed" onClick={addMessage} size="icon" variant="ghost">
                    <MessageCirclePlusIcon className="size-4" />
                    {" "}
                    {t`Workflow.addMessage`}
                </Button>
            </div>

            <OutputSchemaEditor
                onChange={(schema) => {
                    updateNodeData(data.id, {
                        outputSchema: {
                            ...data.outputSchema,
                            properties: {
                                ...data.outputSchema.properties,
                                answer: schema,
                            },
                        },
                    });
                }}
                onOpenChange={setStructuredOutputOpen}
                open={structuredOutputOpen}
                schema={data.outputSchema?.properties?.answer as ObjectJsonSchema7}
            >
                <span className="sr-only" />
            </OutputSchemaEditor>
        </div>
    );
});
LLMNodeDataConfig.displayName = "LLMNodeDataConfig";

export const LLMNodeDataStack = memo(({ data }: { data: LLMNodeData }) => {
    if (!data.model)
        return null;

    const isTextResponse = data.outputSchema.properties?.answer?.type === "string";

    return (
        <div className="mt-4 flex flex-col gap-1 px-4">
            <div className="bg-input flex items-center gap-1 rounded border px-2 py-1 text-[10px]">
                <span className="font-semibold">{data.model.model}</span>
                <VariableIcon className="ml-auto size-3.5 text-blue-500" />
                <span className="text-muted-foreground text-xs">{isTextResponse ? "text" : "object"}</span>
            </div>
        </div>
    );
});
LLMNodeDataStack.displayName = "LLMNodeDataStack";
