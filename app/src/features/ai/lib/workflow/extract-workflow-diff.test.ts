import type { Edge } from "@xyflow/react";
import { describe, expect, it } from "vitest";

import { extractWorkflowDiff } from "./extract-workflow-diff";
import type { UINode } from "./workflow.interface";
import { NodeKind } from "./workflow.interface";

describe("extractWorkflowDiff", () => {
    const createTestNode = (id: string, name: string, position = { x: 0, y: 0 }): UINode => {
        return {
            data: {
                id,
                kind: NodeKind.Input,
                name,
                outputSchema: { properties: {}, type: "object" },
                runtime: {},
            },
            id,
            position,
            type: "default",
        };
    };

    const createTestEdge = (id: string, source: string, target: string): Edge => {
        return {
            id,
            source,
            target,
        };
    };

    it("should detect added nodes and edges", () => {
        const oldData = {
            edges: [createTestEdge("edge1", "node1", "node2")],
            nodes: [createTestNode("node1", "Node 1")],
        };

        const newData = {
            edges: [createTestEdge("edge1", "node1", "node2"), createTestEdge("edge2", "node2", "node3")],
            nodes: [createTestNode("node1", "Node 1"), createTestNode("node2", "Node 2", { x: 100, y: 100 })],
        };

        const result = extractWorkflowDiff(oldData, newData);

        expect(result.deleteNodes).toHaveLength(0);
        expect(result.deleteEdges).toHaveLength(0);
        expect(result.updateNodes).toHaveLength(1);
        expect(result.updateEdges).toHaveLength(1);
        expect(result.updateNodes[0].id).toBe("node2");
        expect(result.updateEdges[0].id).toBe("edge2");
    });

    it("should detect deleted and updated nodes and edges", () => {
        const oldData = {
            edges: [createTestEdge("edge1", "node1", "node2"), createTestEdge("edge2", "node2", "node3")],
            nodes: [createTestNode("node1", "Node 1"), createTestNode("node2", "Node 2"), createTestNode("node3", "Node 3", { x: 50, y: 50 })],
        };

        const newData = {
            edges: [createTestEdge("edge1", "node1", "node3")],
            nodes: [createTestNode("node1", "Node 1 Updated", { x: 10, y: 10 }), createTestNode("node3", "Node 3", { x: 50, y: 50 })],
        };

        const result = extractWorkflowDiff(oldData, newData);

        expect(result.deleteNodes).toHaveLength(1);
        expect(result.deleteNodes[0].id).toBe("node2");
        expect(result.deleteEdges).toHaveLength(1);
        expect(result.deleteEdges[0].id).toBe("edge2");
        expect(result.updateNodes).toHaveLength(1);
        expect(result.updateNodes[0].id).toBe("node1");
        expect(result.updateEdges).toHaveLength(1);
        expect(result.updateEdges[0].id).toBe("edge1");
    });
});
