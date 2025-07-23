import type { ConsolaInstance } from "consola";
import { colorize } from "consola/utils";
import { toAny } from "lib/utils";
import globalLogger from "logger";
import type { StateGraphRegistry } from "ts-edge";
import { createStateGraph, graphNode } from "ts-edge";

import type { DBEdge, DBNode } from "@/types/workflow";

import { convertDBNodeToUINode } from "../shared.workflow";
import { NodeKind } from "../workflow.interface";
import { addEdgeBranchLabel } from "./add-edge-branch-label";
import type { WorkflowRuntimeState } from "./graph-store";
import { createGraphStore } from "./graph-store";
import type { NodeExecutor } from "./node-executor";
import {
    conditionNodeExecutor,
    httpNodeExecutor,
    inputNodeExecutor,
    llmNodeExecutor,
    outputNodeExecutor,
    templateNodeExecutor,
    toolNodeExecutor,
} from "./node-executor";

/**
 * Maps node kinds to their corresponding executor functions.
 * When adding a new node type, add its executor here.
 */
function getExecutorByKind(kind: NodeKind): NodeExecutor {
    switch (kind) {
        case "NOOP" as any: {
            return () => {
                return {
                    input: {},
                    output: {},
                };
            };
        }
        case NodeKind.Condition: {
            return conditionNodeExecutor;
        }
        case NodeKind.Http: {
            return httpNodeExecutor;
        }
        case NodeKind.Input: {
            return inputNodeExecutor;
        }
        case NodeKind.LLM: {
            return llmNodeExecutor;
        }
        case NodeKind.Output: {
            return outputNodeExecutor;
        }
        case NodeKind.Template: {
            return templateNodeExecutor;
        }
        case NodeKind.Tool: {
            return toolNodeExecutor;
        }
    }

    return () => {
        console.warn(`Undefined '${kind}' Node Executor`);

        return {};
    };
}

/**
 * Creates a workflow executor that can run a complete workflow.
 * The executor manages:
 * - Node execution order based on dependencies
 * - Data flow between nodes
 * - Error handling and logging
 * - Branch synchronization for condition nodes
 * @param workflow Contains nodes and edges defining the workflow structure
 * @returns Compiled workflow executor ready to run
 */
export const createWorkflowExecutor = (workflow: { edges: DBEdge[]; logger?: ConsolaInstance; nodes: DBNode[] }) => {
    // Create runtime state store for the workflow
    const store = createGraphStore({
        edges: workflow.edges,
        nodes: workflow.nodes,
    });

    const logger
        = workflow.logger
            ?? globalLogger.withDefaults({
                message: colorize("cyan", `Workflow Executor:`),
            });

    // Create mapping for node ID to name for logging
    const nodeNameByNodeId = new Map<string, string>(workflow.nodes.map((node) => [node.id, node.name]));

    // Create the execution graph using ts-edge library
    const graph = createStateGraph(store) as StateGraphRegistry<WorkflowRuntimeState, string>;

    // Add branch labels for condition node edges
    addEdgeBranchLabel(workflow.nodes, workflow.edges);

    /**
     * Special SKIP node used to handle excess branches from condition nodes.
     * When multiple branches try to execute the same target node,
     * excess executions are routed here to prevent duplicate execution.
     */
    const skipNode = graphNode({
        execute() {
            logger.debug("Noop sink node used to silently terminate excess branches");
        },
        metadata: {
            description: "Noop sink node used to silently terminate excess branches",
        },
        /*  Identification  */
        name: "SKIP", // All "bypass / terminate" tokens land here
    });

    graph.addNode(skipNode);

    // Add all workflow nodes to the execution graph
    workflow.nodes.forEach((node) => {
        graph.addNode({
            async execute(state) {
                // Get the appropriate executor for this node type
                const executor = getExecutorByKind(node.kind as NodeKind);

                // Execute the node with current state
                const result = await executor({
                    node: convertDBNodeToUINode(node).data,
                    state,
                });

                // Store the execution results in the workflow state
                if (result?.output) {
                    state.setOutput(
                        {
                            nodeId: node.id,
                            path: [],
                        },
                        result.output,
                    );
                }

                if (result?.input) {
                    state.setInput(node.id, result.input);
                }
            },
            metadata: {
                kind: node.kind,
            },
            name: node.id,
        });

        // Handle edges differently for condition nodes vs regular nodes
        if (node.kind === NodeKind.Condition) {
            // Condition nodes use dynamic edges based on their evaluation result
            graph.dynamicEdge(node.id, (state) => {
                const next = state.getOutput({
                    nodeId: node.id,
                    path: ["nextNodes"],
                }) as DBNode[];

                if (!next?.length)
                    return;

                return next.map((node) => node.id);
            });
        } else {
            // Regular nodes have static edges defined in the workflow
            const targetEdges = workflow.edges.filter((edge) => edge.source == node.id).map((v) => v.target);

            if (targetEdges.length > 0)
                toAny(graph.edge)(node.id, targetEdges);
        }
    });

    // Build table to track how many branches need to reach each node
    // Used to prevent duplicate execution when multiple condition branches
    // converge on the same target node
    let needTable: Record<string, number> = buildNeedTable(workflow.edges);

    // Compile the graph starting from the Input node
    const app = graph.compile(workflow.nodes.find((node) => node.kind == NodeKind.Input)!.id).use(async ({ input, name: nodeId }, next) => {
        // Check if this node is expecting multiple incoming branches
        if (!(nodeId in needTable))
            return;

        // Decrement the counter - only execute when all branches have arrived
        const left = --needTable[nodeId];

        if (left > 0)
            return next({ input, name: "SKIP" });

        // All branches have arrived, clean up and continue execution
        delete needTable[nodeId];

        return next();
    });

    // Set up event logging for workflow execution monitoring
    app.subscribe((event) => {
        if (event.eventType == "WORKFLOW_START") {
            needTable = buildNeedTable(workflow.edges);
            logger.debug(`[${event.eventType}] ${workflow.nodes.length} nodes, ${workflow.edges.length} edges`);
        } else if (event.eventType == "WORKFLOW_END") {
            const duration = ((event.endedAt - event.startedAt) / 1000).toFixed(2);
            const color = event.isOk ? "green" : "red";

            logger.debug(`[${event.eventType}] ${colorize(color, event.isOk ? "SUCCESS" : "FAILED")} ${duration}s`);

            if (!event.isOk) {
                logger.error(event.error);
            }
        } else if (event.eventType == "NODE_START") {
            logger.debug(`[${event.eventType}] ${nodeNameByNodeId.get(event.node.name)}`);
        } else if (event.eventType == "NODE_END") {
            const duration = ((event.endedAt - event.startedAt) / 1000).toFixed(2);
            const color = event.isOk ? "green" : "red";

            logger.debug(`[${event.eventType}] ${nodeNameByNodeId.get(event.node.name)} ${colorize(color, event.isOk ? "SUCCESS" : "FAILED")} ${duration}s`);
        }
    });

    return app;
};

/**
 * Builds a table tracking how many different branches need to reach each target node.
 * This is used to synchronize execution when multiple condition branches
 * converge on the same target node.
 * @param edges All edges in the workflow
 * @returns Object mapping node IDs to required branch count
 */
function buildNeedTable(edges: DBEdge[]): Record<string, number> {
    const map = new Map<string, Set<string>>();

    // Group edges by target and track unique branch labels
    edges.forEach((e) => {
        const bid = e.uiConfig.label as string;

        (map.get(e.target) ?? map.set(e.target, new Set()).get(e.target))!.add(bid);
    });

    // Only nodes with multiple incoming branches need synchronization
    const table: Record<string, number> = {};

    map.forEach((set, n) => set.size > 1 && (table[n] = set.size));

    return table;
}
