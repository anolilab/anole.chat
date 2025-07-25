import { Button } from "@anole/ui/components/button";
import { Label } from "@anole/ui/components/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import { useLingui } from "@lingui/react/macro";
import type { Edge } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { PlusIcon, Unlink } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";

import { useUpdate } from "@/hooks/use-update";

import type { ConditionNodeData, UINode } from "../../lib/workflow/workflow.interface";
import { NodeKind } from "../../lib/workflow/workflow.interface";
import { createAppendNode } from "./create-append-node";
import { NodeIcon } from "./node-icon";
import { NodeSelect } from "./node-select";

interface NextNodeInfoProperties {
    node: UINode;
    onSelectNode: (nodeId: string) => void;
}

export const NextNodeInfo = ({ node, onSelectNode }: NextNodeInfoProperties) => {
    const { t } = useLingui();
    const { addEdges, addNodes, getEdges, getNodes, setEdges, updateNode } = useReactFlow();
    const nodes = getNodes() as UINode[];
    const edges = getEdges();
    const onDisconnected = useCallback(
        (edge: Edge) => {
            setEdges(edges.filter((e) => e.id !== edge.id));
        },
        [edges],
    );

    const nextNodes = useMemo(() => {
        const connectedEdges = edges.filter((edge) => edge.source === node.id);

        const nextNodes = connectedEdges.map((edge) => {
            return {
                edge,
                node: nodes.find((n) => n.id === edge.target)!,
            };
        });

        return nextNodes;
    }, [edges, nodes]);

    const update = useUpdate();
    const appendNode = useCallback(
        (kind: NodeKind, partialEdge?: Partial<Edge>) => {
            const { edge: newEdge, node: newNode } = createAppendNode({
                allEdges: edges,
                allNodes: nodes,
                edge: partialEdge,
                kind,
                sourceNode: node,
            });

            addNodes([newNode]);

            if (newEdge) {
                addEdges([newEdge]);
            }

            update(() => {
                updateNode(node.id, {
                    selected: false,
                });
            });
        },
        [node.id, nodes, edges, addNodes],
    );

    return (
        <div className="text-muted-foreground flex w-full flex-col">
            <Label className="text-foreground">{t`Next Node`}</Label>
            <p className="my-2 text-xs">{t`Add a next node to this workflow.`}</p>
            {node.data.kind === NodeKind.Condition
                ? (
                    <ConditionNodeDataConnector
                        appendNode={appendNode}
                        nextNodes={nextNodes}
                        node={node}
                        onDisconnected={onDisconnected}
                        onSelectNode={onSelectNode}
                    />
                )
                : (
                    <NextNodeConnector appendNode={appendNode} nextNodes={nextNodes} node={node} onDisconnected={onDisconnected} onSelectNode={onSelectNode} />
                )}
        </div>
    );
};

interface NodeConnectorProperties {
    appendNode: (kind: NodeKind, edge?: Partial<Edge>) => void;
    label?: ReactNode;
    nextNodes: {
        edge: Edge;
        node: UINode;
    }[];
    node: UINode;
    onDisconnected: (edge: Edge) => void;
    onSelectNode: (id: string) => void;
}

const ConditionNodeDataConnector = ({ appendNode, nextNodes, node, onDisconnected, onSelectNode }: NodeConnectorProperties) => {
    const data = node.data as ConditionNodeData;
    const { elseIfNextNodes, elseNextNodes, ifNextNodes } = useMemo(() => {
        const ifNextNodes = nextNodes.filter((n) => n.edge.sourceHandle === data.branches.if.id);
        const elseNextNodes = nextNodes.filter((n) => n.edge.sourceHandle === data.branches.else.id);
        const elseIfNextNodes = (data.branches.elseIf ?? []).map((brach) => nextNodes.filter((n) => n.edge.sourceHandle === brach.id));

        return { elseIfNextNodes, elseNextNodes, ifNextNodes };
    }, [nextNodes, node.data]);

    return (
        <div className="flex flex-col gap-4">
            <NextNodeConnector
                appendNode={(kind) => appendNode(kind, { sourceHandle: data.branches.if.id })}
                label={(
                    <div className="py-1 text-center font-bold">
                        <span className="text-blue-500">IF</span>
                        {" "}
                        CASE 1
                    </div>
                )}
                nextNodes={ifNextNodes}
                node={node}
                onDisconnected={onDisconnected}
                onSelectNode={onSelectNode}
            />
            {elseIfNextNodes.map((n, index) => (
                <NextNodeConnector
                    appendNode={(kind) => appendNode(kind, { sourceHandle: data.branches.elseIf![index].id })}
                    key={index}
                    label={(
                        <div className="py-1 text-center font-bold">
                            <span className="text-blue-500">ELSE IF</span>
                            {" "}
                            CASE
                            {index + 2}
                        </div>
                    )}
                    nextNodes={n}
                    node={node}
                    onDisconnected={onDisconnected}
                    onSelectNode={onSelectNode}
                />
            ))}

            <NextNodeConnector
                appendNode={(kind) => appendNode(kind, { sourceHandle: data.branches.else.id })}
                label={(
                    <div className="py-1 text-center font-bold">
                        <span className="text-blue-500">ELSE</span>
                        {" "}
                        CASE
                        {elseIfNextNodes.length + 2}
                    </div>
                )}
                nextNodes={elseNextNodes}
                node={node}
                onDisconnected={onDisconnected}
                onSelectNode={onSelectNode}
            />
        </div>
    );
};

const NextNodeConnector = ({ appendNode, label, nextNodes, node, onDisconnected, onSelectNode }: NodeConnectorProperties) => {
    const { t } = useLingui();

    return (
        <div className="flex w-full">
            <div className="py-1">
                <div className="flex items-center rounded-lg border p-[7px]">
                    <NodeIcon type={node.data.kind} />
                </div>
            </div>
            <div className="py-1">
                <div className="flex items-center py-[7px]">
                    <div className="flex h-6 w-6 items-center">
                        <div className="bg-border h-2 w-0.5 rounded-r" />
                        <div className="bg-border h-[1px] w-full" />
                        <div className="bg-border h-2 w-0.5 rounded-l" />
                    </div>
                </div>
            </div>

            <div className="bg-background flex min-w-0 flex-1 flex-col gap-1 rounded-lg p-1 text-xs">
                {label}
                {nextNodes.map((n) => (
                    <div
                        className="group hover:bg-secondary bg-card flex w-full cursor-pointer items-center gap-2 rounded-lg border p-1.5 transition-colors"
                        key={n.node.data.name}
                        onClick={onSelectNode?.bind(null, n.node.data.id)}
                    >
                        <NodeIcon type={n.node.data.kind} />
                        {n.node.data.name}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    className="hover:border-destructive ml-auto flex items-center gap-1 rounded border p-1 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDisconnected(n.edge);
                                    }}
                                >
                                    <Unlink className="group-hover:text-destructive size-3" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>{t`Unlink Node`}</TooltipContent>
                        </Tooltip>
                    </div>
                ))}
                <NodeSelect onChange={appendNode}>
                    <Button
                        className="data-[state=open]:bg-secondary! text-muted-foreground w-full justify-start border border-dashed text-xs"
                        size="lg"
                        variant="ghost"
                    >
                        <PlusIcon className="size-3" />
                        <span>{t`Add Next Node`}</span>
                    </Button>
                </NodeSelect>
            </div>
        </div>
    );
};
