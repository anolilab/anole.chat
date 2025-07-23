"use client";

import { useLingui } from "@lingui/react/macro";
import { useReactFlow } from "@xyflow/react";
import { Trash2Icon } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";

import type { WorkflowNodeData } from "../../lib/workflow/workflow.interface";
import { NodeKind } from "../../lib/workflow/workflow.interface";

export const NodeContextMenuContent = ({ node }: { node: WorkflowNodeData }) => {
    const { setEdges, setNodes } = useReactFlow();
    const { t } = useLingui();

    const handleDeleteNode = useCallback(() => {
        if (node.kind === NodeKind.Input) {
            return toast.warning(t`Workflow.inputNodeCannotBeDeleted`);
        }

        setEdges((edges) => edges.filter((edge) => edge.source !== node.id && edge.target !== node.id));
        setNodes((nodes) => nodes.filter((v) => v.id !== node.id));
    }, [node.id]);

    return (
        <div className="flex w-full min-w-40 flex-col gap-2 text-sm">
            <div
                className="hover:bg-destructive/10 text-destructive flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors"
                onClick={handleDeleteNode}
            >
                <Trash2Icon className="size-3" />
                {t`Common.delete`}
            </div>
        </div>
    );
};
