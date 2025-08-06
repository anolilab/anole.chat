"use client";

import { Button } from "@anole/ui/components/button";
import { Separator } from "@anole/ui/components/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import MCPIcon from "@anole/ui/icons/mcp";
import { useLingui } from "@lingui/react/macro";
import { useEdges, useNodes, useReactFlow } from "@xyflow/react";
import { ChevronDown, InfoIcon, VariableIcon, WrenchIcon } from "lucide-react";
import { memo, useEffect, useMemo } from "react";

import { useWorkflowStore } from "@/app/store/workflow.store";
import { SelectModel } from "@/components/select-model";
import { useMcpList } from "@/hooks/queries/use-mcp-list";

import { DefaultToolName } from "../../lib/tools";
import { tavilySearchSchema, tavilySearchTool, tavilyWebContentSchema, tavilyWebContentTool } from "../../lib/tools/web/web-search";
import type { ToolNodeData, UINode, WorkflowToolKey } from "../../lib/workflow/workflow.interface";
import { appStore } from "../../store";
import { OutputSchemaMentionInput } from "../output-schema-mention-input";
import { WorkflowToolSelect } from "../workflow-tool-select";

export const ToolNodeDataConfig = memo(({ data }: { data: ToolNodeData }) => {
    const { t } = useLingui();
    const { updateNodeData } = useReactFlow();
    const nodes = useNodes() as UINode[];
    const edges = useEdges();
    const editable = useWorkflowStore((state) => state.processIds.length === 0 && state.hasEditAccess && !state.workflow?.isPublished);

    const { data: mcpList } = useMcpList();

    const toolList = useMemo<WorkflowToolKey[]>(() => {
        const mcpTools: WorkflowToolKey[] = mcpList.flatMap((mcp) =>
            mcp.toolInfo.map((tool) => {
                return {
                    description: tool.description,
                    id: tool.name,
                    parameterSchema: tool.inputSchema,
                    serverId: mcp.id,
                    serverName: mcp.name,
                    type: "mcp-tool",
                };
            }),
        );
        const defaultTools: WorkflowToolKey[] = [
            {
                description: tavilySearchTool.description!,
                id: DefaultToolName.WebSearch,
                parameterSchema: tavilySearchSchema,
                type: "app-tool",
            },
            {
                description: tavilyWebContentTool.description!,
                id: DefaultToolName.WebContent,
                parameterSchema: tavilyWebContentSchema,
                type: "app-tool",
            },
        ];

        return [...mcpTools, ...defaultTools];
    }, [mcpList]);

    useEffect(() => {
        if (!data.model) {
            updateNodeData(data.id, {
                model: appStore.getState().chatModel!,
            });
        }
    }, []);

    return (
        <div className="flex flex-col gap-2 px-4 text-sm">
            <p className="text-sm font-semibold">{t`Tool`}</p>
            <WorkflowToolSelect
                onChange={(tool) => {
                    updateNodeData(data.id, { tool });
                }}
                tool={data.tool}
                tools={toolList}
            />
            <p className="my-2 text-sm font-semibold">{t`Description & Schema`}</p>
            {data.tool?.description || Object.keys(data.tool?.parameterSchema?.properties || {}).length > 0
                ? (
                    <div className="bg-background rounded-md border p-2 text-xs">
                        <p>{data.tool?.description}</p>
                        {Object.keys(data.tool?.parameterSchema?.properties || {}).length > 0 && (
                            <div className="mt-2 flex flex-wrap items-center gap-1">
                                {Object.keys(data.tool?.parameterSchema?.properties || {}).map((key) => {
                                    const isRequired = data.tool?.parameterSchema?.required?.includes(key);

                                    return (
                                        <div className="bg-secondary mb-0.5 flex items-center rounded-md px-1.5 py-0.5 text-xs" key={key}>
                                            <VariableIcon className="size-3.5 text-blue-500" />
                                            {isRequired && <span className="text-destructive">*</span>}
                                            <span className="font-semibold">{key}</span>

                                            <span className="text-muted-foreground ml-2">
                                                {typeof data.tool?.parameterSchema?.properties?.[key] === "string"
                                    ? data.tool?.parameterSchema?.properties?.[key]
                                    : data.tool?.parameterSchema?.properties?.[key]?.type || "unknown"}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )
                : (
                    <div className="text-muted-foreground rounded-md border py-2 text-center text-xs">{t`No description and schema`}</div>
                )}

            <Separator className="my-4" />
            <div className="flex items-center gap-2">
                <p className="my-2 text-sm font-semibold">Message</p>
                <SelectModel
                    defaultModel={data.model}
                    onSelect={(model) => {
                        updateNodeData(data.id, {
                            model,
                        });
                    }}
                >
                    <Button className="data-[state=open]:bg-input! hover:bg-input! ml-auto" size="sm" variant="outline">
                        <p className="mr-auto">{data.model?.model ?? <span className="text-muted-foreground">model</span>}</p>
                        <ChevronDown className="size-3" />
                    </Button>
                </SelectModel>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="hover:bg-secondary cursor-pointer rounded p-1">
                            <InfoIcon className="size-3" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-4 whitespace-pre-wrap">{t`Provide information needed for LLM to generate tool parameters.\n\nUse '/' to mention data from previous nodes.`}</TooltipContent>
                </Tooltip>
            </div>
            <div className="bg-secondary min-h-20 w-full rounded-md p-2">
                <OutputSchemaMentionInput
                    content={data.message}
                    currentNodeId={data.id}
                    edges={edges}
                    editable={editable}
                    nodes={nodes}
                    onChange={(content) => {
                        updateNodeData(data.id, {
                            message: content,
                        });
                    }}
                />
            </div>
        </div>
    );
});
ToolNodeDataConfig.displayName = "ToolNodeDataConfig";

export const ToolNodeStack = memo(({ data }: { data: ToolNodeData }) => {
    const { t } = useLingui();
    const selectedToolLabel = useMemo(() => {
        if (!data.tool) {
            return (
                <>
                    <WrenchIcon className="size-3" />
                    <span className="text-muted-foreground">{t`Select Tool...`}</span>
                </>
            );
        }

        if (data.tool.type === "mcp-tool") {
            return (
                <>
                    <MCPIcon className="size-3" />
                    <span className="font-bold">{data.tool.serverName}</span>
                    <div className="bg-primary text-primary-foreground truncate rounded-md px-2">{data.tool.id}</div>
                </>
            );
        }

        return (
            <>
                <WrenchIcon className="size-3" />
                <span className="truncate font-semibold">{data.tool.id}</span>
            </>
        );
    }, [data.tool]);

    return (
        <div className="mt-4 flex flex-col gap-1 px-4">
            {data.tool
                ? (
                    <div className="bg-input flex items-center gap-1 rounded border px-2 py-1 text-[10px]">{selectedToolLabel}</div>
                )
                : (
                    <div className="text-muted-foreground rounded-md border py-2 text-center text-xs">{t`No results.`}</div>
                )}
        </div>
    );
});
ToolNodeStack.displayName = "ToolNodeStack";
