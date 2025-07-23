"use client";

import { Label } from "@anole/ui/components/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import { useLingui } from "@lingui/react/macro";
import { useEdges, useNodes, useReactFlow } from "@xyflow/react";
import { InfoIcon } from "lucide-react";
import { memo, useCallback } from "react";

import { useWorkflowStore } from "@/app/store/workflow.store";
import type { TipTapMentionJsonContent } from "@/types/util";

import type { TemplateNodeData, UINode } from "../../lib/workflow/workflow.interface";
import { OutputSchemaMentionInput } from "../output-schema-mention-input";

interface TemplateNodeConfigProperties {
    data: TemplateNodeData;
}

export const TemplateNodeConfig = memo(({ data }: TemplateNodeConfigProperties) => {
    const { t } = useLingui();
    const { updateNodeData } = useReactFlow<UINode>();
    const nodes = useNodes() as UINode[];
    const edges = useEdges();
    const editable = useWorkflowStore((state) => state.processIds.length === 0 && state.hasEditAccess && !state.workflow?.isPublished);

    const handleTemplateChange = useCallback(
        (template: TipTapMentionJsonContent) => {
            updateNodeData(data.id, {
                template: { tiptap: template, type: "tiptap" },
            });
        },
        [data.id, updateNodeData],
    );

    return (
        <div className="flex flex-col gap-2 px-4 text-sm">
            <div>
                <div className="flex items-center justify-between">
                    <Label className="mt-1 text-sm">{t`Workflow.template`}</Label>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="hover:bg-secondary cursor-pointer rounded p-1">
                                <InfoIcon className="size-3" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent align="center" className="p-4 whitespace-pre-wrap" side="left">
                            {t`Workflow.templateDescription`}
                        </TooltipContent>
                    </Tooltip>
                </div>
                <div className="bg-secondary w-full rounded-md p-2">
                    <OutputSchemaMentionInput
                        className="min-h-48"
                        content={data.template.tiptap}
                        currentNodeId={data.id}
                        edges={edges}
                        editable={editable}
                        nodes={nodes}
                        onChange={handleTemplateChange}
                    />
                </div>
            </div>
        </div>
    );
});
