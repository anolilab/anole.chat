"use client";

import type { Edge } from "@xyflow/react";
import { generateUniqueKey } from "lib/utils";
import { v4 as uuidv4 } from "uuid";

import { createUINode } from "../../lib/workflow/create-ui-node";
import type { LLMNodeData, UINode } from "../../lib/workflow/workflow.interface";
import { NodeKind } from "../../lib/workflow/workflow.interface";
import { appStore } from "../../store";

/**
 * Creates a new workflow node and connects it to an existing source node.
 * This function handles:
 * - Generating unique node names and IDs
 * - Positioning the new node relative to the source
 * - Creating the connecting edge between nodes
 * - Setting appropriate default configurations
 * @param params Configuration for creating the new node
 * @returns Object containing the new node and optional connecting edge
 */
export function createAppendNode({
    allEdges,
    allNodes,
    edge,
    kind,
    sourceNode,
}: {
    allEdges: Edge[];
    allNodes: UINode[];
    edge?: Partial<Edge>;
    kind: NodeKind;
    sourceNode: UINode;
}): { edge?: Edge; node: UINode } {
    const connectors = new Set(allEdges.filter((edge) => edge.source === sourceNode.id).map((v) => v.target));

    const connectedNodes = allNodes.filter((node) => connectors.has(node.id));

    const maxY = Math.max(...connectedNodes.map((node) => node.position.y + (node.measured?.height ?? 0)));

    const names = allNodes.map((node) => node.data.name as string);
    const name = generateUniqueKey(kind.toUpperCase(), names);

    const node = createUINode(kind, {
        name,
        position: {
            x: sourceNode.position.x + 300 * 1.2,
            y: connectedNodes.length === 0 ? sourceNode.position.y : maxY + 80,
        },
    });

    if (kind === NodeKind.LLM) {
        (node.data as LLMNodeData).model = appStore.getState().chatModel! ?? {};
    }

    if (kind === NodeKind.Note) {
        return {
            node,
        };
    }

    return {
        edge: {
            id: uuidv4(),
            source: sourceNode.id,
            target: node.id,
            ...edge,
        },
        node,
    };
}
