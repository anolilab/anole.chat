"use client";

import "@xyflow/react/dist/style.css";

import { debounce } from "@tanstack/react-pacer";
import type { Connection, Edge, IsValidConnection, NodeMouseHandler, OnConnect, OnEdgesChange, OnNodesChange, OnSelectionChangeFunc } from "@xyflow/react";
import { addEdge, applyEdgeChanges, applyNodeChanges, Background, Panel, ReactFlow } from "@xyflow/react";
import { fetcher } from "lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { v4 as uuidv4 } from "uuid";

import { useWorkflowStore } from "@/app/store/workflow.store";
import { DefaultNode } from "@/components/workflow/default-node";
import { WorkflowPanel } from "@/components/workflow/workflow-panel";
import { safe } from "@/lib/safe-async";
import type { DBWorkflow } from "@/types/workflow";

import { extractWorkflowDiff } from "../../lib/workflow/extract-workflow-diff";
import { convertUIEdgeToDBEdge, convertUINodeToDBNode } from "../../lib/workflow/shared.workflow";
import type { UINode } from "../../lib/workflow/workflow.interface";
import { NodeKind } from "../../lib/workflow/workflow.interface";
import { wouldCreateCycle } from "../../lib/workflow/would-create-cycle";

const nodeTypes = {
    default: DefaultNode,
};

const debounceFunction = (function_: () => void, delay: number) => {
    const debouncedFunction = debounce(function_, { wait: delay });

    debouncedFunction();
};

const fitViewOptions = {
    duration: 500,
    padding: 1,
};

export default function Workflow({
    hasEditAccess,
    initialEdges,
    initialNodes,
    workflowId,
}: {
    hasEditAccess?: boolean;
    initialEdges: Edge[];
    initialNodes: UINode[];
    workflowId: string;
}) {
    const { addProcess, init, processIds } = useWorkflowStore();
    const [nodes, setNodes] = useState<UINode[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);

    const isProcessing = useMemo(() => processIds.length > 0, [processIds.length]);
    const { data: workflow } = useSWR<DBWorkflow>(`/api/workflow/${workflowId}`, fetcher, {
        onSuccess: (workflow) => {
            init(workflow, hasEditAccess);
        },
    });
    const [activeNodeIds, setActiveNodeIds] = useState<string[]>([]);

    const snapshot = useRef({ edges: initialEdges, nodes: initialNodes });

    const editable = useMemo(() => !isProcessing && hasEditAccess && !workflow?.isPublished, [isProcessing, hasEditAccess, workflow?.isPublished]);

    const save = async () => {
        if (workflow?.isPublished)
            return;

        const diff = extractWorkflowDiff(snapshot.current, { edges, nodes });

        if (diff.deleteEdges.length > 0 || diff.deleteNodes.length > 0 || diff.updateEdges.length > 0 || diff.updateNodes.length > 0) {
            const stop = addProcess();

            await safe()
                .map(() => saveWorkflow(workflowId, diff))
                .ifOk(() => {
                    snapshot.current = {
                        edges,
                        nodes,
                    };
                })
                .ifFail(() => {
                    globalThis.location.reload();
                })
                .watch(stop)
                .unwrap();
        }
    };

    const selectedNode = useMemo(() => nodes.findLast((node) => node.selected), [nodes]);

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => {
            if (!editable) {
                setNodes((nds) => {
                    let updatedNodes = nds;

                    changes.forEach((change) => {
                        if (change.type === "select") {
                            updatedNodes = applyNodeChanges([change], updatedNodes) as UINode[];
                        } else if (change.type === "replace" && "item" in change) {
                            const newNode = change.item as UINode;

                            updatedNodes = updatedNodes.map((node) => {
                                if (node.id === change.id) {
                                    return {
                                        ...node,
                                        data: {
                                            ...node.data,
                                            runtime: newNode.data.runtime,
                                        },
                                    };
                                }

                                return node;
                            });
                        }
                    });

                    return updatedNodes;
                });

                return;
            }

            setNodes((nds) => applyNodeChanges(changes, nds) as UINode[]);
        },
        [editable],
    );
    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => {
            if (!editable)
                return;

            setEdges((eds) => applyEdgeChanges(changes, eds));
        },
        [editable],
    );
    const onConnect: OnConnect = useCallback(
        (connection) => {
            if (!editable)
                return;

            setEdges((eds) =>
                addEdge(
                    {
                        ...connection,
                        id: uuidv4(),
                    },
                    eds,
                ),
            );
        },
        [editable],
    );

    const onSelectionChange: OnSelectionChangeFunc = useCallback(({ nodes: selectedNodes }) => {
        setActiveNodeIds(selectedNodes.map((node) => node.id));
    }, []);
    const onNodeMouseEnter: NodeMouseHandler = useCallback((_, node) => {
        setActiveNodeIds((previous) => (previous.includes(node.id) ? previous : [...previous, node.id]));
    }, []);

    const onNodeMouseLeave: NodeMouseHandler = useCallback((_, node) => {
        setActiveNodeIds((previous) => previous.filter((id) => id !== node.id));
    }, []);

    const isValidConnection: IsValidConnection = useCallback(
        (connection) => {
            if (!editable)
                return false;

            if (connection.source === connection.target)
                return false;

            return !wouldCreateCycle(connection as Connection, edges as Connection[]);
        },
        [editable, edges],
    );

    const { errorIds, runningIds, successIds } = useMemo(
        () =>
            nodes.reduce(
                (accumulator, previous) => {
                    if (previous.data.runtime?.status === "fail") {
                        accumulator.errorIds.push(previous.id);
                    }

                    if (previous.data.runtime?.status === "running") {
                        accumulator.runningIds.push(previous.id);
                    }

                    if (previous.data.runtime?.status === "success") {
                        accumulator.successIds.push(previous.id);
                    }

                    return accumulator;
                },
                {
                    errorIds: [] as string[],
                    runningIds: [] as string[],
                    successIds: [] as string[],
                },
            ),
        [nodes],
    );

    const styledEdges = useMemo(
        () =>
            edges.map((edge) => {
                const isConnected = activeNodeIds.includes(edge.source) || activeNodeIds.includes(edge.target);

                const isErrorEdge = errorIds.includes(edge.target) && (successIds.includes(edge.source) || errorIds.includes(edge.source));
                const isRunningEdge = runningIds.includes(edge.target) && successIds.includes(edge.source);
                const isSuccessEdge = successIds.includes(edge.target) && (successIds.includes(edge.source) || runningIds.includes(edge.source));

                return {
                    ...edge,
                    animated: runningIds.includes(edge.source),
                    style: {
                        ...edge.style,
                        stroke: isErrorEdge
                            ? "var(--destructive)"
                            : isRunningEdge || isSuccessEdge
                                ? "#05df72"
                                : isConnected
                                    ? "oklch(62.3% 0.214 259.815)"
                                    : undefined,
                        strokeWidth: 2,
                        transition: "stroke 0.3s",
                    },
                };
            }),
        [edges, activeNodeIds, errorIds, runningIds],
    );

    useEffect(() => {
        const debounceDelay = snapshot.current.nodes.length !== nodes.length || snapshot.current.edges.length !== edges.length ? 200 : 10_000;

        debounceFunction(save, debounceDelay);
    }, [nodes, edges]);

    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.data.kind === NodeKind.Input && !node.selected) {
                    return { ...node, selected: true };
                }

                return node;
            }),
        );
    }, []);

    useEffect(() => {
        init(workflow, hasEditAccess);
    }, [workflow, hasEditAccess]);

    return (
        <div className="text-de text-gree-4 relative h-full w-full">
            <ReactFlow
                deleteKeyCode={null}
                edges={styledEdges}
                fitView
                fitViewOptions={fitViewOptions}
                id={workflowId}
                isValidConnection={isValidConnection}
                maxZoom={1.4}
                minZoom={0.1}
                multiSelectionKeyCode={null}
                nodes={nodes}
                nodeTypes={nodeTypes}
                onConnect={onConnect}
                onEdgesChange={onEdgesChange}
                onNodeMouseEnter={onNodeMouseEnter}
                onNodeMouseLeave={onNodeMouseLeave}
                onNodesChange={onNodesChange}
                onSelectionChange={onSelectionChange}
            >
                <Background gap={12} size={0.6} />
                <Panel className="z-20!" position="top-right">
                    {workflow && (
                        <WorkflowPanel
                            addProcess={addProcess}
                            hasEditAccess={hasEditAccess}
                            isProcessing={isProcessing}
                            onSave={save}
                            selectedNode={selectedNode}
                            workflow={workflow}
                        />
                    )}
                </Panel>
                <Panel className="pointer-events-none! m-0! h-full w-full" position="top-left">
                    <div className="from-background pointer-events-none absolute inset-0 z-10 h-1/12 w-full bg-gradient-to-b to-transparent to-90%" />
                    <div className="from-background pointer-events-none absolute inset-0 z-10 h-full w-1/12 bg-gradient-to-r to-transparent" />
                    <div className="from-background pointer-events-none absolute bottom-0 left-0 z-10 h-1/12 w-full bg-gradient-to-t to-transparent" />
                    <div className="from-background pointer-events-none absolute right-0 bottom-0 z-10 h-full w-1/12 bg-gradient-to-l to-transparent" />
                </Panel>
            </ReactFlow>
        </div>
    );
}

function saveWorkflow(workflowId: string, diff: ReturnType<typeof extractWorkflowDiff>) {
    return fetch(`/api/workflow/${workflowId}/structure`, {
        body: JSON.stringify({
            deleteEdges: diff.deleteEdges.map((edge) => edge.id),
            deleteNodes: diff.deleteNodes.map((node) => node.id),
            edges: diff.updateEdges.map((edge) => convertUIEdgeToDBEdge(workflowId, edge)),
            nodes: diff.updateNodes.map((node) => convertUINodeToDBNode(workflowId, node)),
        }),
        method: "POST",
    }).then((res) => {
        if (res.status >= 400) {
            throw new Error(String(res.statusText || res.status || "Error"));
        }
    });
}
