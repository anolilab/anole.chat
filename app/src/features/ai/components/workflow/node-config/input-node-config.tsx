"use client";

import { Button } from "@anole/ui/components/button";
import { Label } from "@anole/ui/components/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import { useLingui } from "@lingui/react/macro";
import { useReactFlow } from "@xyflow/react";
import { objectFlow } from "lib/utils";
import { InfoIcon, PencilIcon, PlusIcon, TrashIcon, VariableIcon } from "lucide-react";
import { memo, useCallback } from "react";

import type { Feild } from "../../edit-json-schema-field-popup";
import { EditJsonSchemaFieldPopup, getFieldKey } from "../../edit-json-schema-field-popup";
import type { InputNodeData, WorkflowNodeData } from "../../lib/workflow/workflow.interface";

export const InputNodeDataConfig = memo(({ data }: { data: InputNodeData }) => {
    const { t } = useLingui();
    const { updateNodeData } = useReactFlow();

    const checkRequired = useCallback((key: string) => data.outputSchema.required?.includes(key), [data.outputSchema]);

    const addField = useCallback(
        (field: Feild) => {
            updateNodeData(data.id, (node) => {
                const previous = node.data as InputNodeData;
                const outputSchema = {
                    ...previous.outputSchema,
                    properties: {
                        ...previous.outputSchema.properties,
                        [field.key]: {
                            default: field.defaultValue,
                            description: field.description,
                            enum: field.type == "string" && field.enum ? field.enum : undefined,
                            type: field.type,
                        },
                    },
                    required: field.required
                        ? [...new Set([field.key, ...previous.outputSchema.required ?? []])]
                        : previous.outputSchema.required?.filter((k) => k != field.key),
                };

                return {
                    outputSchema,
                };
            });
        },
        [data.id],
    );

    const removeField = useCallback(
        (key: string) => {
            updateNodeData(data.id, (node) => {
                const previous = node.data as InputNodeData;
                const outputSchema = {
                    ...previous.outputSchema,
                    properties: objectFlow(previous.outputSchema.properties).filter((_, k) => k != key),
                    required: previous.outputSchema.required?.filter((k) => k != key),
                };

                return {
                    outputSchema,
                };
            });
        },
        [data.outputSchema],
    );

    return (
        <div className="flex flex-col gap-2 px-4 text-sm">
            <div className="flex items-center justify-between">
                <Label className="text-sm">{t`Workflow.inputFields`}</Label>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="hover:bg-secondary cursor-pointer rounded p-1">
                            <InfoIcon className="size-3.5" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent align="center" className="p-4 text-sm break-words whitespace-pre-wrap" side="left">
                        {t`Workflow.inputFieldsDescription`}
                    </TooltipContent>
                </Tooltip>
            </div>
            <div className="flex flex-col gap-1">
                {Object.entries(data.outputSchema.properties ?? {}).map(([key, value]) => (
                    <div className="bg-secondary group/item flex cursor-pointer items-center gap-1 rounded border px-2 py-1" key={key}>
                        <VariableIcon className="size-3 text-blue-500" />

                        <span>{key}</span>
                        <div className="flex-1" />

                        <span className="text-muted-foreground block text-xs group-hover/item:hidden">
                            <span className="text-destructive text-[10px]">{checkRequired(key) ? "*" : " "}</span>
                            {getFieldKey(value)}
                        </span>
                        <div className="hidden items-center gap-1 group-hover/item:flex">
                            <EditJsonSchemaFieldPopup
                                editAbleKey={false}
                                field={{
                                    defaultValue: value.default as any,
                                    description: value.description,
                                    enum: value.enum as string[],
                                    key,
                                    required: checkRequired(key),
                                    type: value.type as any,
                                }}
                                onChange={addField}
                            >
                                <div className="text-muted-foreground hover:bg-input cursor-pointer rounded p-1">
                                    <PencilIcon className="size-3" />
                                </div>
                            </EditJsonSchemaFieldPopup>
                            <div className="text-destructive hover:bg-destructive/10 cursor-pointer rounded p-1" onClick={() => removeField(key)}>
                                <TrashIcon className="size-3" />
                            </div>
                        </div>
                    </div>
                ))}
                <EditJsonSchemaFieldPopup onChange={addField}>
                    <Button className="text-muted-foreground mt-1 w-full border border-dashed" variant="ghost">
                        <PlusIcon />
                        {" "}
                        {t`Workflow.addInputField`}
                    </Button>
                </EditJsonSchemaFieldPopup>
            </div>
        </div>
    );
});
InputNodeDataConfig.displayName = "InputNodeDataConfig";

export const OutputSchemaStack = memo(({ data }: { data: WorkflowNodeData }) => {
    const keys = Object.keys(data.outputSchema?.properties ?? {});

    if (keys.length === 0)
        return null;

    return (
        <div className="mt-4 flex flex-col gap-1 px-4">
            {keys.map((v) => {
                const schema = data.outputSchema.properties[v];

                return (
                    <div className="bg-input flex items-center gap-1 rounded border px-2 py-1 text-[10px]" key={v}>
                        <VariableIcon className="size-3 text-blue-500" />
                        <span>{v}</span>
                        <div className="flex-1" />

                        <span className="text-muted-foreground block text-xs text-[10px] group-hover/item:hidden">
                            <span className="text-destructive">{data.outputSchema.required?.includes(v) ? "*" : " "}</span>
                            {getFieldKey(schema)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
});
OutputSchemaStack.displayName = "OutputSchemaStack";
