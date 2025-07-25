"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { useReactFlow } from "@xyflow/react";
import { exclude } from "lib/utils";
import { TrashIcon, VariableIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { findAvailableSchemaBySource } from "../../lib/workflow/shared.workflow";
import type { HttpValue, OutputSchemaSourceKey, UINode } from "../../lib/workflow/workflow.interface";
import { VariableMentionItem } from "./variable-mention-item";
import { VariableSelect } from "./variable-select";

interface HttpValueInputProperties {
    allowedTypes?: string[];
    className?: string;
    currentNodeId: string;
    onChange: (value: HttpValue | undefined) => void;
    onDelete?: () => void;
    placeholder?: string;
    value: HttpValue | undefined;
}

export const HttpValueInput = ({ allowedTypes = [], className, currentNodeId, onChange, onDelete, placeholder, value }: HttpValueInputProperties) => {
    const { getEdges, getNodes } = useReactFlow<UINode>();
    const { t } = useLingui();
    // Check if current value is a variable reference
    const isVariable = value && typeof value === "object" && "nodeId" in value;

    // Get the node name for display if it's a variable
    const getVariable = (sourceKey: OutputSchemaSourceKey) => {
        const data = findAvailableSchemaBySource({
            edges: getEdges(),
            nodeId: currentNodeId,
            nodes: getNodes().map((node) => node.data),
            source: sourceKey,
        });

        return exclude(data, ["type"]);
    };

    const handleLiteralChange = (inputValue: string) => {
        if (inputValue === "") {
            onChange(undefined);

            return;
        }

        onChange(inputValue);
    };

    const handleVariableSelect = (item: { nodeId: string; nodeName: string; path: string[]; type: string }) => {
        onChange({
            nodeId: item.nodeId,
            path: item.path,
        });
    };

    return (
        <div className={cn("flex min-w-0 items-center gap-1", className)}>
            {isVariable
                ? (
                    <div className="min-w-0 flex-1">
                        <VariableMentionItem
                            className="truncate py-[7px] text-sm"
                            {...getVariable(value as OutputSchemaSourceKey)}
                            onRemove={() => onChange(undefined)}
                        />
                    </div>
                )
                : (
                    <Input
                        className="flex-1 placeholder:text-xs"
                        onChange={(e) => handleLiteralChange(e.target.value)}
                        placeholder={placeholder}
                        value={value?.toString() || ""}
                    />
                )}

            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <VariableSelect allowedTypes={allowedTypes} currentNodeId={currentNodeId} onChange={handleVariableSelect}>
                            <Button
                                className="data-[state=open]:bg-secondary"
                                onPointerDown={(e) => {
                                    if (isVariable) {
                                        e.preventDefault();
                                        onChange(undefined);
                                    }
                                }}
                                size="icon"
                                variant={isVariable ? "secondary" : "ghost"}
                            >
                                <VariableIcon className={isVariable ? "text-blue-500" : ""} />
                            </Button>
                        </VariableSelect>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t`Select Variable`}</p>
                </TooltipContent>
            </Tooltip>
            {onDelete && (
                <Button onClick={onDelete} size="icon" variant="ghost">
                    <TrashIcon />
                </Button>
            )}
        </div>
    );
};
