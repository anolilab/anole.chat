import type { Edge } from "@xyflow/react";
import type { Message } from "ai";
import type { JSONSchema7 } from "json-schema";
import { exclude } from "lib/utils";
import type { GraphEvent } from "ts-edge";

import type { ObjectJsonSchema7, TipTapMentionJsonContent, TipTapMentionJsonContentPart } from "@/types/util";
import type { DBEdge, DBNode } from "@/types/workflow";

import type { OutputSchemaSourceKey, UINode, WorkflowNodeData } from "./workflow.interface";

export const defaultObjectJsonSchema: ObjectJsonSchema7 = {
    properties: {},
    type: "object",
};

export function findAccessibleNodeIds({
    edges,
    nodeId,
    nodes,
}: {
    edges: { source: string; target: string }[];
    nodeId: string;
    nodes: WorkflowNodeData[];
}): string[] {
    const accessibleNodes: string[] = [];
    const allNodeIds = new Set(nodes.map((node) => node.id));
    let currentNodes = [nodeId];

    while (currentNodes.length > 0) {
        const targets = [...currentNodes];

        currentNodes = [];

        for (const target of targets) {
            const sources = edges.filter((edge) => edge.target === target && allNodeIds.has(edge.source)).map((edge) => edge.source);

            accessibleNodes.push(...sources);
            currentNodes.push(...sources);
        }
    }

    return accessibleNodes;
}

export function findJsonSchemaByPath(schema: ObjectJsonSchema7, path: string[]): JSONSchema7 | undefined {
    const [key, ...rest] = path;

    if (rest.length === 0) {
        return schema.properties?.[key] as JSONSchema7;
    }

    return findJsonSchemaByPath(schema.properties![key] as ObjectJsonSchema7, rest);
}

export function findAvailableSchemaBySource({
    edges,
    nodeId,
    nodes,
    source,
}: {
    edges: { source: string; target: string }[];
    nodeId: string;
    nodes: WorkflowNodeData[];
    source: OutputSchemaSourceKey;
}): {
    nodeName: string;
    notFound?: boolean;
    path: string[];
    type?: string;
} {
    const accessibleNodes = findAccessibleNodeIds({
        edges,
        nodeId,
        nodes,
    });
    const data = {
        nodeName: "ERROR",
        notFound: true,
        path: source.path,
        type: undefined as undefined | string,
    };

    if (!accessibleNodes.includes(source.nodeId))
        return data;

    const sourceNode = nodes.find((node) => node.id === source.nodeId)!;

    if (!sourceNode)
        return data;

    data.nodeName = sourceNode.name;
    const schema = findJsonSchemaByPath(sourceNode.outputSchema, source.path);

    if (!schema)
        return data;

    data.notFound = false;
    data.type = typeof schema === "string" ? schema : (schema?.type as string);

    return data;
}

export function convertUINodeToDBNode(workflowId: string, node: UINode): Omit<DBNode, "createdAt" | "updatedAt"> {
    return {
        description: node.data.description || "",
        id: node.id,
        kind: node.data.kind,
        name: node.data.name,
        nodeConfig: exclude(node.data, ["id", "name", "description", "runtime"]),
        uiConfig: {
            position: node.position,
            type: node.type || "default",
        },
        workflowId,
    };
}

export function convertDBNodeToUINode(node: DBNode): UINode {
    const uiNode: UINode = {
        id: node.id,
        ...(node.uiConfig as any),
        data: {
            ...(node.nodeConfig as any),
            description: node.description || "",
            id: node.id,
            kind: node.kind as any,
            name: node.name,
        },
        type: node.uiConfig.type || "default",
    };

    return uiNode;
}

export function convertUIEdgeToDBEdge(workflowId: string, edge: Edge): Omit<DBEdge, "createdAt" | "updatedAt"> {
    return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        uiConfig: {
            label: edge.label ?? undefined,
            sourceHandle: edge.sourceHandle ?? undefined,
            targetHandle: edge.targetHandle ?? undefined,
        },
        workflowId,
    };
}

export function convertDBEdgeToUIEdge(edge: DBEdge): Edge {
    return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        ...edge.uiConfig,
    };
}

// Workflow Stream Processing Functions
export const WORKFLOW_STREAM_DELIMITER = "\n";
export const WORKFLOW_STREAM_PREFIX = "WF_EVENT:";

export function encodeWorkflowEvent(event: GraphEvent): string {
    const eventData = {
        timestamp: Date.now(),
        ...event,
    };

    return `${WORKFLOW_STREAM_PREFIX}${JSON.stringify(eventData)}${WORKFLOW_STREAM_DELIMITER}`;
}

export function decodeWorkflowEvents(buffer: string): {
    events: GraphEvent[];
    remainingBuffer: string;
} {
    const lines = buffer.split(WORKFLOW_STREAM_DELIMITER);
    const remainingBuffer = lines.pop() || "";
    const events: GraphEvent[] = [];

    for (const line of lines) {
        if (line.startsWith(WORKFLOW_STREAM_PREFIX)) {
            try {
                const eventJson = line.slice(WORKFLOW_STREAM_PREFIX.length);
                const event = JSON.parse(eventJson);

                events.push(event);
            } catch (error) {
                console.error("Failed to parse workflow event:", line, error);
            }
        }
    }

    return { events, remainingBuffer };
}

export function convertTiptapJsonToText({
    getOutput,
    json,
    mentionParser,
}: {
    getOutput: (key: OutputSchemaSourceKey) => any;
    json: TipTapMentionJsonContent;
    mentionParser?: (part: Extract<TipTapMentionJsonContentPart, { type: "mention" }>) => string;
}): string {
    const parser
        = mentionParser
            || ((part) => {
                const key = JSON.parse(part.attrs.label) as OutputSchemaSourceKey;
                const mentionItem = getOutput(key) || "";
                const value = typeof mentionItem === "object" ? JSON.stringify(mentionItem) : String(mentionItem);

                return value;
            });

    return (
        json.content
            ?.flatMap((p) => p.content)
            .filter(Boolean)
            .reduce((previous, part) => {
                let data = "";

                if (!part)
                    return previous;

                switch (part.type) {
                    case "hardBreak": {
                        data += "\n\n";

                        break;
                    }
                    case "mention": {
                        data += parser(part);

                        break;
                    }
                    case "text": {
                        data += ` ${part.text}`;

                        break;
                    }
                    // No default
                }

                return previous + data;
            }, "")
            .trim() || ""
    );
}

export function convertTiptapJsonToAiMessage({
    getOutput,
    json,
    role,
}: {
    getOutput: (key: OutputSchemaSourceKey) => any;
    json?: TipTapMentionJsonContent;
    role: "user" | "assistant" | "system";
}): Omit<Message, "id"> {
    if (!json) {
        return {
            content: "",
            parts: [],
            role,
        };
    }

    const text = convertTiptapJsonToText({
        getOutput,
        json,
        mentionParser: (part) => {
            const key = JSON.parse(part.attrs.label) as OutputSchemaSourceKey;
            const mentionItem = getOutput(key) || "";
            const value
                = typeof mentionItem === "object" ? `\n\`\`\`json\n${JSON.stringify(mentionItem, null, 2)}\n\`\`\`\n` : mentionItem ? String(mentionItem) : "";

            return value;
        },
    });

    return {
        content: text,
        parts: [
            {
                text,
                type: "text",
            },
        ],
        role,
    };
}
