import type { Edge } from "@xyflow/react";
import { describe, expect, it } from "vitest";

import { allNodeValidate, inputNodeValidate, llmNodeValidate, outputNodeValidate, validateSchema } from "./node-validate";
import type { UINode } from "./workflow.interface";
import { NodeKind } from "./workflow.interface";

describe("node-validate", () => {
    const createInputNodeData = (
        id: string,
        name: string,
        outputSchema = {
            properties: { input: { type: "string" as const } },
            type: "object" as const,
        },
    ): UINode<NodeKind.Input> => {
        return {
            data: {
                id,
                kind: NodeKind.Input,
                name,
                outputSchema,
            },
            id,
            position: { x: 0, y: 0 },
            type: "default",
        };
    };

    const createOutputNodeData = (id: string, name: string, outputData: any[] = []): UINode<NodeKind.Output> => {
        return {
            data: {
                id,
                kind: NodeKind.Output,
                name,
                outputData,
                outputSchema: { properties: {}, type: "object" },
            },
            id,
            position: { x: 0, y: 0 },
            type: "default",
        };
    };

    const createLLMNodeData = (
        id: string,
        name: string,
        model: any = { id: "gpt-4", name: "GPT-4" },
        messages: any[] = [{ content: { content: [], type: "doc" }, role: "user" }],
    ): UINode<NodeKind.LLM> => {
        return {
            data: {
                id,
                kind: NodeKind.LLM,
                messages,
                model,
                name,
                outputSchema: { properties: {}, type: "object" },
            },
            id,
            position: { x: 0, y: 0 },
            type: "default",
        };
    };

    const createEdge = (id: string, source: string, target: string): Edge => {
        return {
            id,
            source,
            target,
        };
    };

    describe("validateSchema", () => {
        it("should validate valid string schema", () => {
            expect(() => {
                validateSchema("test", { type: "string" });
            }).not.toThrow();
        });

        it("should throw error for invalid variable name", () => {
            expect(() => {
                validateSchema("", { type: "string" });
            }).toThrow();
        });

        it("should throw error for schema without type", () => {
            expect(() => {
                validateSchema("test", {});
            }).toThrow();
        });
    });

    describe("inputNodeValidate", () => {
        it("should validate start node with edge and inputs", () => {
            const startNode = createInputNodeData("start", "Start Node");
            const edges = [createEdge("edge1", "start", "end")];

            expect(() => {
                inputNodeValidate({ edges, node: startNode.data, nodes: [] });
            }).not.toThrow();
        });

        it("should throw error when start node has no edge", () => {
            const startNode = createInputNodeData("start", "Start Node");

            expect(() => {
                inputNodeValidate({ edges: [], node: startNode.data, nodes: [] });
            }).toThrow();
        });
    });

    describe("outputNodeValidate", () => {
        it("should validate end node with proper source", () => {
            const startNode = createInputNodeData("start", "Start Node");
            const endNode = createOutputNodeData("end", "End Node", [
                {
                    key: "result",
                    source: { nodeId: "start", path: ["input"] },
                },
            ]);
            const nodes = [startNode, endNode];
            const edges = [createEdge("edge1", "start", "end")];

            expect(() => {
                outputNodeValidate({ edges, node: endNode.data, nodes });
            }).not.toThrow();
        });

        it("should throw error when end node has duplicate output keys", () => {
            const endNode = createOutputNodeData("end", "End Node", [
                { key: "result", source: { nodeId: "start", path: ["input"] } },
                { key: "result", source: { nodeId: "start", path: ["input"] } },
            ]);

            expect(() => {
                outputNodeValidate({ edges: [], node: endNode.data, nodes: [] });
            }).toThrow();
        });
    });

    describe("llmNodeValidate", () => {
        it("should validate LLM node with model and messages", () => {
            const llmNode = createLLMNodeData("llm", "LLM Node");

            expect(() => {
                llmNodeValidate({ edges: [], node: llmNode.data, nodes: [] });
            }).not.toThrow();
        });

        it("should throw error when LLM node has no model", () => {
            const llmNode = createLLMNodeData("llm", "LLM Node", null);

            expect(() => {
                llmNodeValidate({ edges: [], node: llmNode.data, nodes: [] });
            }).toThrow();
        });

        it("should throw error when LLM node has no messages", () => {
            const llmNode = createLLMNodeData("llm", "LLM Node", { id: "gpt-4", name: "GPT-4" }, []);

            expect(() => {
                llmNodeValidate({ edges: [], node: llmNode.data, nodes: [] });
            }).toThrow();
        });
    });

    describe("allNodeValidate", () => {
        it("should validate workflow with start and end nodes", () => {
            const startNode = createInputNodeData("start", "Start Node");
            const endNode = createOutputNodeData("end", "End Node", [
                {
                    key: "result",
                    source: { nodeId: "start", path: ["input"] },
                },
            ]);
            const nodes = [startNode, endNode];
            const edges = [createEdge("edge1", "start", "end")];

            const result = allNodeValidate({ edges, nodes });

            expect(result).toBe(true);
        });

        it("should return error when nodes have duplicate names", () => {
            const startNode1 = createInputNodeData("start1", "Duplicate Name");
            const startNode2 = createOutputNodeData("start1", "Duplicate Name");
            const nodes = [startNode1, startNode2];
            const edges = [];

            const result = allNodeValidate({ edges, nodes });

            expect(result).not.toBe(true);
            expect(result).toHaveProperty("errorMessage");
        });
    });
});
