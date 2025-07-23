import { generateUUID } from "lib/utils";

import type { ObjectJsonSchema7 } from "@/types/util";

import { defaultObjectJsonSchema } from "./shared.workflow";
import type { UINode } from "./workflow.interface";
import { NodeKind } from "./workflow.interface";

export function createUINode(
    kind: NodeKind,
    option?: Partial<{
        id?: string;
        name?: string;
        position: { x: number; y: number };
    }>,
): UINode {
    const id = option?.id ?? generateUUID();

    const node: UINode = {
        ...option,
        data: {
            id,
            kind: kind as any,
            name: option?.name ?? kind.toUpperCase(),
            outputSchema: structuredClone(defaultObjectJsonSchema),
            runtime: {
                isNew: true,
            },
        },
        id,
        position: option?.position ?? { x: 0, y: 0 },
        type: "default",
    };

    switch (node.data.kind) {
        case NodeKind.Condition: {
            node.data.branches = {
                else: {
                    conditions: [],
                    id: "else",
                    logicalOperator: "AND",
                    type: "else",
                },
                if: {
                    conditions: [],
                    id: "if",
                    logicalOperator: "AND",
                    type: "if",
                },
            };

            break;
        }
        case NodeKind.Http: {
            node.data.outputSchema.properties = {
                response: {
                    properties: {
                        body: {
                            type: "string",
                        },
                        duration: {
                            type: "number",
                        },
                        headers: {
                            type: "object",
                        },
                        ok: {
                            type: "boolean",
                        },
                        size: {
                            type: "number",
                        },
                        status: {
                            type: "number",
                        },
                        statusText: {
                            type: "string",
                        },
                    },
                    type: "object",
                },
            };
            // Set default values for HTTP node
            node.data.method = "GET";
            node.data.headers = [];
            node.data.query = [];
            node.data.timeout = 30_000; // 30 seconds default

            break;
        }
        case NodeKind.LLM: {
            node.data.outputSchema = structuredClone(defaultLLMNodeOutputSchema);
            node.data.messages = [
                {
                    role: "user",
                },
            ];

            break;
        }
        case NodeKind.Output: {
            node.data.outputData = [];

            break;
        }
        case NodeKind.Template: {
            node.data.outputSchema = structuredClone(defaultTemplateNodeOutputSchema);
            // Set default values for Template node
            node.data.template = {
                tiptap: {
                    content: [],
                    type: "doc",
                },
                type: "tiptap",
            };

            break;
        }
        case NodeKind.Tool: {
            node.data.outputSchema.properties = {
                tool_result: {
                    type: "object",
                },
            };

            break;
        }
        // No default
    }

    return node;
}

export const defaultLLMNodeOutputSchema: ObjectJsonSchema7 = {
    properties: {
        answer: {
            type: "string",
        },
        totalTokens: {
            type: "number",
        },
    },
    type: "object",
};

export const defaultTemplateNodeOutputSchema: ObjectJsonSchema7 = {
    properties: {
        template: {
            type: "string",
        },
    },
    type: "object",
};
