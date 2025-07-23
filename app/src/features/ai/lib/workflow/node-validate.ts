import type { Edge } from "@xyflow/react";
import type { JSONSchema7 } from "json-schema";
import { cleanVariableName } from "lib/utils";
import { safe } from "ts-safe";

import type {
    ConditionNodeData,
    HttpNodeData,
    InputNodeData,
    LLMNodeData,
    OutputNodeData,
    TemplateNodeData,
    ToolNodeData,
    UINode,
    WorkflowNodeData,
} from "../lib/workflow/workflow.interface";
import { NodeKind } from "../lib/workflow/workflow.interface";
import type { ConditionBranch } from "./condition";
import { findJsonSchemaByPath } from "./shared.workflow";

export function validateSchema(key: string, schema: JSONSchema7) {
    const variableName = cleanVariableName(key);

    if (variableName.length === 0) {
        throw new Error("Invalid Variable Name");
    }

    if (variableName.length > 255) {
        throw new Error("Variable Name is too long");
    }

    if (!schema.type) {
        throw new Error("Invalid Schema");
    }

    if (schema.type == "array" || schema.type == "object") {
        const keys = Object.keys(schema.properties ?? {});

        if (keys.length != new Set(keys).size) {
            throw new Error("Output data must have unique keys");
        }

        return keys.every((key) => validateSchema(key, schema.properties![key] as JSONSchema7));
    }

    return true;
}

type NodeValidate<T> = (context: { edges: Edge[]; node: T; nodes: UINode[] }) => void;

export function allNodeValidate({ edges, nodes }: { edges: Edge[]; nodes: UINode[] }):
    | true
    | {
        errorMessage: string;
        node?: UINode;
    } {
    if (!nodes.some((n) => n.data.kind === NodeKind.Input)) {
        return {
            errorMessage: "Input node must be only one",
        };
    }

    if (!nodes.some((n) => n.data.kind === NodeKind.Output)) {
        return {
            errorMessage: "Output node must be only one",
        };
    }

    for (const node of nodes) {
        const result = safe()
            .ifOk(() => nodeValidate({ edges, node: node.data, nodes }))
            .ifFail((error) => {
                return {
                    errorMessage: error.message,
                    node,
                };
            })
            .unwrap();

        if (result) {
            return result;
        }
    }

    return true;
}

export const nodeValidate: NodeValidate<WorkflowNodeData> = ({ edges, node, nodes }) => {
    if (node.kind != NodeKind.Note && nodes.filter((n) => n.data.name === node.name).length > 1) {
        throw new Error("Node name must be unique");
    }

    switch (node.kind) {
        case NodeKind.Condition: {
            return conditionNodeValidate({ edges, node, nodes });
        }
        case NodeKind.Http: {
            return httpNodeValidate({ edges, node, nodes });
        }
        case NodeKind.Input: {
            return inputNodeValidate({ edges, node, nodes });
        }
        case NodeKind.LLM: {
            return llmNodeValidate({ edges, node, nodes });
        }
        case NodeKind.Output: {
            return outputNodeValidate({ edges, node, nodes });
        }
        case NodeKind.Template: {
            return templateNodeValidate({ edges, node, nodes });
        }
        case NodeKind.Tool: {
            return toolNodeValidate({ edges, node, nodes });
        }
    }
};

export const inputNodeValidate: NodeValidate<InputNodeData> = ({ edges, node }) => {
    if (!edges.some((e) => e.source === node.id)) {
        throw new Error("Input node must have an edge");
    }

    const outputKeys = Object.keys(node.outputSchema.properties ?? {});

    outputKeys.forEach((key) => {
        validateSchema(key, node.outputSchema.properties![key] as JSONSchema7);
    });
};

export const outputNodeValidate: NodeValidate<OutputNodeData> = ({ edges, node, nodes }) => {
    const names = node.outputData.map((data) => data.key);
    const uniqueNames = [...new Set(names)];

    if (names.length !== uniqueNames.length) {
        throw new Error("Output data must have unique keys");
    }

    node.outputData.forEach((data) => {
        const variableName = cleanVariableName(data.key);

        if (variableName.length === 0) {
            throw new Error("Invalid Variable Name");
        }

        if (variableName.length > 255) {
            throw new Error("Variable Name is too long");
        }

        if (!data.source)
            throw new Error("Output data must have a source");

        if (data.source.path.length === 0)
            throw new Error("Output data must have a path");

        const sourceNode = nodes.find((n) => n.data.id === data.source?.nodeId);

        if (!sourceNode)
            throw new Error("Source node not found");

        const sourceSchema = findJsonSchemaByPath(sourceNode.data.outputSchema, data.source.path);

        if (!sourceSchema)
            throw new Error("Source schema not found");
    });

    let current: WorkflowNodeData | undefined = node as WorkflowNodeData;

    while (current && current.kind !== NodeKind.Input) {
        const previousNodeId = edges.find((e) => e.target === current!.id)?.source;

        if (!previousNodeId)
            throw new Error("Prev node must have an edge");

        const previousNode = nodes.find((n) => n.data.id === previousNodeId);

        current = previousNode ? (previousNode.data as WorkflowNodeData) : undefined;
    }

    if (current?.kind !== NodeKind.Input)
        throw new Error("Prev node must be a Input node");
};

export const llmNodeValidate: NodeValidate<LLMNodeData> = ({ node }) => {
    if (!node.model)
        throw new Error("LLM node must have a model");

    node.messages.map((message) => {
        if (!message.role)
            throw new Error("LLM node must have a role");

        if (!message.content)
            throw new Error("LLM node must have a content");
    });

    if (node.messages.length === 0)
        throw new Error("LLM node must have a message");
};

export const conditionNodeValidate: NodeValidate<ConditionNodeData> = ({ node }) => {
    const branchValidate = (branch: ConditionBranch) => {
        branch.conditions.forEach((condition) => {
            if (!condition.operator)
                throw new Error("Condition must have a operator");

            if (!condition.source)
                throw new Error("Condition must have a value");
        });
    };

    [node.branches.if, ...node.branches.elseIf ?? []].forEach(branchValidate);
};

export const toolNodeValidate: NodeValidate<ToolNodeData> = ({ node }) => {
    if (!node.tool)
        throw new Error("Tool node must have a tool");

    if (!node.model)
        throw new Error("Tool node must have a model");

    if (!node.message)
        throw new Error("Tool node must have a message");
};

export const httpNodeValidate: NodeValidate<HttpNodeData> = ({ node }) => {
    // Validate URL is provided (can be empty string, but must be defined)
    if (node.url === undefined) {
        throw new Error("HTTP node must have a URL defined");
    }

    // Validate HTTP method
    const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"];

    if (!validMethods.includes(node.method)) {
        throw new Error(`HTTP method must be one of: ${validMethods.join(", ")}`);
    }

    // Validate timeout if provided
    if (node.timeout !== undefined) {
        if (typeof node.timeout !== "number" || node.timeout <= 0) {
            throw new Error("HTTP timeout must be a positive number");
        }

        if (node.timeout > 300_000) {
            // 5 minutes max
            throw new Error("HTTP timeout cannot exceed 300000ms (5 minutes)");
        }
    }

    // Validate headers format
    if (node.headers) {
        for (const header of node.headers) {
            if (!header.key || header.key.trim().length === 0) {
                throw new Error("Header key cannot be empty");
            }

            // Check for duplicate header keys (case insensitive)
            const lowerKey = header.key.toLowerCase();
            const duplicates = node.headers.filter((h) => h.key.toLowerCase() === lowerKey);

            if (duplicates.length > 1) {
                throw new Error(`Duplicate header key: ${header.key}`);
            }
        }
    }

    // Validate query parameters format
    if (node.query) {
        for (const queryParameter of node.query) {
            if (!queryParameter.key || queryParameter.key.trim().length === 0) {
                throw new Error("Query parameter key cannot be empty");
            }
        }
    }

    // Validate body is only used with appropriate methods
    if (node.body !== undefined && !["PATCH", "POST", "PUT"].includes(node.method)) {
        throw new Error(`Body is not allowed for ${node.method} requests`);
    }
};

export const templateNodeValidate: NodeValidate<TemplateNodeData> = ({ node }) => {
    // Validate template type
    const validTypes = ["tiptap"]; // Future: add "handlebars"

    if (!validTypes.includes(node.template.type)) {
        throw new Error(`Template type must be one of: ${validTypes.join(", ")}`);
    }

    // Template content can be undefined/empty - that's valid
    // The actual content validation is handled by the TipTap editor
};
