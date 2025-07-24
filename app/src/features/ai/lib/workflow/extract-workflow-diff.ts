import type { Edge } from "@xyflow/react";
import equal from "fast-deep-equal";
import { exclude } from "lib/utils";

import type { UINode } from "./workflow.interface";

function normalizeNode(node: UINode) {
    return {
        data: exclude(node.data, ["id", "runtime", "description", "name"]),
        description: node.data.description || "",
        id: node.id,
        name: node.data.name || "",
        position: { ...node.position },
    };
}

function normalizeEdge(edge: Edge) {
    return {
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle ?? "",
        target: edge.target,
        targetHandle: edge.targetHandle ?? "",
    };
}

export function extractWorkflowDiff(oldData: { edges: Edge[]; nodes: UINode[] }, newData: { edges: Edge[]; nodes: UINode[] }) {
    const deleteNodes: UINode[] = [];
    const deleteEdges: Edge[] = [];
    const updateNodes: UINode[] = [];
    const updateEdges: Edge[] = [];

    const oldNodes = oldData.nodes;
    const newNodes = new Map<string, UINode>(newData.nodes.map((node) => [node.id, node]));

    oldNodes.forEach((node) => {
        const newNode = newNodes.get(node.id);

        if (!newNode) {
            deleteNodes.push(node);
        } else if (!equal(normalizeNode(node), normalizeNode(newNode))) {
            updateNodes.push(newNode);
        }

        newNodes.delete(node.id);
    });

    updateNodes.push(...newNodes.values());

    const oldEdges = oldData.edges;
    const newEdges = new Map<string, Edge>(newData.edges.map((edge) => [edge.id, edge]));

    oldEdges.forEach((edge) => {
        const newEdge = newEdges.get(edge.id);

        if (!newEdge) {
            deleteEdges.push(edge);
        } else if (!equal(normalizeEdge(edge), normalizeEdge(newEdge))) {
            updateEdges.push(newEdge);
        }

        newEdges.delete(edge.id);
    });

    updateEdges.push(...newEdges.values());

    return {
        deleteEdges,
        deleteNodes,
        updateEdges,
        updateNodes,
    };
}
