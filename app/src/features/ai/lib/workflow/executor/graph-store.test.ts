import { describe, expect, it } from "vitest";

import type { DBNode } from "@/types/workflow";

import { createGraphStore } from "./graph-store";

describe("workflow-store", () => {
    it("source", () => {
        const store = createGraphStore({
            edges: [],
            nodes: [],
        });
        const context = store();

        expect(context.outputs).toEqual({});
        expect(
            context.getOutput({
                nodeId: "v1",
                path: [],
            }),
        ).toBe(undefined);
        expect(
            context.getOutput({
                nodeId: "v1",
                path: ["person"],
            }),
        ).toBe(undefined);

        context.setOutput(
            {
                nodeId: "v1",
                path: ["person"],
            },
            {
                age: 30,
                name: "cgoing",
            },
        );
        expect(
            context.getOutput({
                nodeId: "v1",
                path: ["person"],
            }),
        ).toEqual({
            age: 30,
            name: "cgoing",
        });

        expect(
            context.getOutput({
                nodeId: "v1",
                path: ["person", "name"],
            }),
        ).toBe("cgoing");

        expect(
            context.getOutput({
                nodeId: "v1",
                path: ["person", "name", "xxx"],
            }),
        ).toBe(undefined);

        context.setOutput(
            {
                nodeId: "v2",
                path: ["person", "name", "xxx"],
            },
            "xxx",
        );

        expect(
            context.getOutput({
                nodeId: "v2",
                path: ["person", "name", "xxx"],
            }),
        ).toBe("xxx");
    });
    it("default value", () => {
        const store = createGraphStore({
            edges: [],
            nodes: [
                {
                    id: "v1",
                    nodeConfig: {
                        outputSchema: {
                            properties: {
                                name: {
                                    default: "cgoing",
                                    type: "string",
                                },
                            },
                            type: "object",
                        },
                    },
                } as unknown as DBNode,
            ],
        });
        const context = store();

        expect(
            context.getOutput({
                nodeId: "v1",
                path: ["name"],
            }),
        ).toBe("cgoing");
    });
});
