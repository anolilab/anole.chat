import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@anole/ui/components/dropdown-menu";
import { Input } from "@anole/ui/components/input";
import { Label } from "@anole/ui/components/label";
import { Separator } from "@anole/ui/components/separator";
import { Textarea } from "@anole/ui/components/textarea";
import { useLingui } from "@lingui/react/macro";
import { useReactFlow } from "@xyflow/react";
import { nextTick } from "lib/utils";
import { MoreHorizontalIcon, XIcon } from "lucide-react";

import type { UINode } from "../../lib/workflow/workflow.interface";
import { NodeKind } from "../../lib/workflow/workflow.interface";
import { NextNodeInfo } from "./next-node-info";
import { ConditionNodeDataConfig } from "./node-config/condition-node-config";
import { HttpNodeConfig } from "./node-config/http-node-config";
import { InputNodeDataConfig } from "./node-config/input-node-config";
import { LLMNodeDataConfig } from "./node-config/llm-node-config";
import { OutputNodeDataConfig } from "./node-config/output-node-config";
import { TemplateNodeConfig } from "./node-config/template-node-config";
import { ToolNodeDataConfig } from "./node-config/tool-node-config";
import { NodeContextMenuContent } from "./node-context-menu-content";
import { NodeIcon } from "./node-icon";

export const SelectedNodeConfigTab = ({ node }: { node: UINode }) => {
    const { t } = useLingui();
    const { setNodes, updateNode, updateNodeData } = useReactFlow();

    return (
        <div className="bg-card h-[85vh] w-sm space-y-4 overflow-y-auto rounded-lg border py-4 shadow-lg" key={node.id}>
            {/* Header */}
            <div className="px-4">
                <div className="flex items-center justify-between">
                    <div className="flex w-full items-center gap-2">
                        <NodeIcon type={node.data.kind} />
                        <Input
                            className="border-none bg-transparent px-0 text-lg font-semibold"
                            maxLength={20}
                            onChange={(e) => updateNodeData(node.id, { name: e.target.value })}
                            value={node.data.name}
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="hover:bg-secondary ml-auto cursor-pointer rounded p-1">
                                    <MoreHorizontalIcon className="size-3.5" />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <NodeContextMenuContent node={node.data} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div
                            className="hover:bg-secondary cursor-pointer rounded p-1"
                            onClick={() => {
                                setNodes((nodes) => nodes.map((n) => (n.id === node.id ? { ...n, selected: false } : n)));
                            }}
                        >
                            <XIcon className="size-3.5" />
                        </div>
                    </div>
                </div>
                {node.data.kind !== NodeKind.Note && (
                    <Textarea
                        className="mt-2 h-6 max-h-14 min-h-6 resize-none overflow-y-auto rounded-none border-none bg-transparent p-0 text-xs"
                        onChange={(e) =>
                            updateNodeData(node.id, {
                                description: e.target.value,
                            })}
                        placeholder={t`Workflow.nodeDescriptionPlaceholder`}
                        value={node.data.description}
                    />
                )}
            </div>

            <Separator className="my-6" />
            <div className="flex-1">
                {node.data.kind === NodeKind.Input
                    ? (
                        <InputNodeDataConfig data={node.data} />
                    )
                    : node.data.kind === NodeKind.Output
                        ? (
                            <OutputNodeDataConfig data={node.data} />
                        )
                        : node.data.kind === NodeKind.LLM
                            ? (
                                <LLMNodeDataConfig data={node.data} />
                            )
                            : node.data.kind === NodeKind.Condition
                                ? (
                                    <ConditionNodeDataConfig data={node.data} />
                                )
                                : node.data.kind === NodeKind.Tool
                                    ? (
                                        <ToolNodeDataConfig data={node.data} />
                                    )
                                    : node.data.kind === NodeKind.Http
                                        ? (
                                            <HttpNodeConfig node={node} />
                                        )
                                        : node.data.kind === NodeKind.Template
                                            ? (
                                                <TemplateNodeConfig data={node.data} />
                                            )
                                            : node.data.kind === NodeKind.Note
                                                ? (
                                                    <div className="flex h-full flex-col gap-2 px-4">
                                                        <Label className="text-muted-foreground text-xs" htmlFor="description">
                                                            {t`Common.description`}
                                                        </Label>
                                                        <Textarea
                                                            className="max-h-80 min-h-80 resize-none overflow-y-auto"
                                                            id="description"
                                                            onChange={(e) =>
                                                                updateNodeData(node.id, {
                                                                    description: e.target.value,
                                                                })}
                                                            value={node.data.description}
                                                        />
                                                    </div>
                                                )
                                                : null}
            </div>

            {![NodeKind.Note, NodeKind.Output].includes(node.data.kind) && (
                <>
                    <Separator className="my-6" />
                    <div className="px-4">
                        <NextNodeInfo
                            node={node}
                            onSelectNode={(id) => {
                                updateNode(node.id, { selected: false });
                                nextTick().then(() => updateNode(id, { selected: true }));
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
};
