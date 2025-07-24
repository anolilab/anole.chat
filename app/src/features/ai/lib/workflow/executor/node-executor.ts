import type { Message } from "ai";
import { generateObject, generateText } from "ai";
import { AppError } from "lib/errors";
import { convertJsonSchemaToZod } from "zod-from-json-schema";

import { checkConditionBranch } from "../condition";
import { mcpClientsManager } from "../lib/mcp/mcp-manager";
import { customModelProvider } from "../lib/models";
import { DefaultToolName } from "../lib/tools";
import { tavilySearchToolForWorkflow, tavilyWebContentToolForWorkflow } from "../lib/tools/web/web-search";
import { convertTiptapJsonToAiMessage, convertTiptapJsonToText } from "../shared.workflow";
import type {
    ConditionNodeData,
    HttpNodeData,
    InputNodeData,
    LLMNodeData,
    OutputNodeData,
    OutputSchemaSourceKey,
    TemplateNodeData,
    ToolNodeData,
    WorkflowNodeData,
} from "../workflow.interface";
import type { WorkflowRuntimeState } from "./graph-store";

/**
 * Interface for node executor functions.
 * Each node type implements this interface to define its execution behavior.
 * @param input Contains the node data and current workflow state
 * @returns Object with optional input and output data to be stored in workflow state
 */
export type NodeExecutor<T extends WorkflowNodeData = any> = (input: { node: T; state: WorkflowRuntimeState }) =>
    | Promise<{
        input?: any; // Input data used by this node (for debugging/history)
        output?: any; // Output data produced by this node (available to subsequent nodes)
    }>
    | {
        input?: any;
        output?: any;
    };

/**
 * Input Node Executor
 * Entry point of the workflow - passes the initial query data to subsequent nodes
 */
export const inputNodeExecutor: NodeExecutor<InputNodeData> = ({ state }) => {
    return {
        output: state.query, // Pass through the initial workflow input
    };
};

/**
 * Output Node Executor
 * Exit point of the workflow - collects data from specified source nodes
 * and combines them into the final workflow result
 */
export const outputNodeExecutor: NodeExecutor<OutputNodeData> = ({ node, state }) => {
    return {
        output: node.outputData.reduce((accumulator, current) => {
            // Collect data from each configured source node
            accumulator[current.key] = state.getOutput(current.source!);

            return accumulator;
        }, {} as object),
    };
};

/**
 * LLM Node Executor
 * Executes Large Language Model interactions with support for:
 * - Multiple messages (system, user, assistant)
 * - References to previous node outputs via mentions
 * - Configurable model selection
 */
export const llmNodeExecutor: NodeExecutor<LLMNodeData> = async ({ node, state }) => {
    const model = customModelProvider.getModel(node.model);

    // Convert TipTap JSON messages to AI SDK format, resolving mentions to actual data
    const messages: Omit<Message, "id">[] = node.messages.map((message) =>
        convertTiptapJsonToAiMessage({
            getOutput: state.getOutput, // Provides access to previous node outputs
            json: message.content,
            role: message.role,
        }),
    );

    const isTextResponse = node.outputSchema.properties?.answer?.type === "string";

    state.setInput(node.id, {
        chatModel: node.model,
        messages,
        responseFormat: isTextResponse ? "text" : "object",
    });

    if (isTextResponse) {
        const response = await generateText({
            maxSteps: 1,
            messages,
            model,
        });

        return {
            output: {
                answer: response.text,
                totalTokens: response.usage.totalTokens,
            },
        };
    }

    const response = await generateObject({
        maxRetries: 3,
        messages,
        model,
        schema: convertJsonSchemaToZod(node.outputSchema.properties.answer),
    });

    return {
        output: {
            answer: response.object,
            totalTokens: response.usage.totalTokens,
        },
    };
};

/**
 * Condition Node Executor
 * Evaluates conditional logic and determines which branch(es) to execute next.
 * Supports if-elseIf-else structure with AND/OR logical operators.
 */
export const conditionNodeExecutor: NodeExecutor<ConditionNodeData> = async ({ node, state }) => {
    // Evaluate conditions in order: if, then elseIf branches, finally else
    const okBranch = [node.branches.if, ...node.branches.elseIf || []].find((branch) => checkConditionBranch(branch, state.getOutput)) || node.branches.else;

    // Find the target nodes for the selected branch
    const nextNodes = state.edges
        .filter((edge) => edge.uiConfig.sourceHandle === okBranch.id && edge.source === node.id)
        .map((edge) => state.nodes.find((node) => node.id === edge.target)!)
        .filter(Boolean);

    return {
        output: {
            branch: okBranch.id, // Branch identifier
            nextNodes, // Nodes to execute next (used by dynamic edge resolution)
            type: okBranch.type, // Which branch was taken
        },
    };
};

/**
 * Tool Node Executor
 * Executes external tools (primarily MCP tools) with optional LLM-generated parameters.
 *
 * Workflow:
 * 1. If tool has parameter schema, use LLM to generate parameters from message
 * 2. Execute the tool with generated or empty parameters
 * 3. Return the tool execution result
 */
export const toolNodeExecutor: NodeExecutor<ToolNodeData> = async ({ node, state }) => {
    const result: {
        input: any;
        output: any;
    } = {
        input: undefined,
        output: undefined,
    };

    if (!node.tool)
        throw new Error("Tool not found");

    // Handle parameter generation
    if (node.tool?.parameterSchema) {
        // Use LLM to generate tool parameters from the provided message
        const prompt: string | undefined = node.message
            ? convertTiptapJsonToAiMessage({
                getOutput: state.getOutput, // Access to previous node outputs
                json: node.message,
                role: "user",
            }).parts[0]?.text
            : undefined;

        const response = await generateText({
            maxSteps: 1,
            model: customModelProvider.getModel(node.model),
            prompt,
            toolChoice: "required", // Force the model to call the tool
            tools: {
                [node.tool.id]: {
                    description: node.tool.description,
                    parameters: convertJsonSchemaToZod(node.tool.parameterSchema),
                },
            },
        });

        result.input = {
            parameter: response.toolCalls.find((call) => call.args)?.args,
            prompt,
        };
    } else {
        // Tool doesn't need parameters
        result.input = {
            parameter: undefined,
        };
    }

    // Execute the tool based on its type
    if (node.tool.type === "mcp-tool") {
        const toolResult = (await mcpClientsManager.toolCall(node.tool.serverId, node.tool.id, result.input.parameter)) as any;

        if (toolResult.isError) {
            throw new Error(toolResult.error?.message || toolResult.error?.name || JSON.stringify(toolResult));
        }

        result.output = {
            tool_result: toolResult,
        };
    } else if (node.tool.type === "app-tool") {
        const executor
            = node.tool.id === DefaultToolName.WebContent
                ? tavilyWebContentToolForWorkflow.execute
                : node.tool.id === DefaultToolName.WebSearch
                    ? tavilySearchToolForWorkflow.execute
                    : () => "Unknown tool";

        const toolResult = await executor(result.input.parameter, {
            messages: [],
            toolCallId: "",
        });

        result.output = {
            tool_result: toolResult,
        };
    } else {
        // Placeholder for future tool types
        result.output = {
            tool_result: {
                error: `Not implemented "${node.tool?.type}"`,
            },
        };
    }

    return result;
};

/**
 * Resolves HttpValue to actual string value
 * Handles string literals and references to other node outputs
 */
function resolveHttpValue(value: string | OutputSchemaSourceKey | undefined, getOutput: WorkflowRuntimeState["getOutput"]): string {
    if (value === undefined)
        return "";

    if (typeof value === "string")
        return value;

    // It's an OutputSchemaSourceKey - resolve from node output
    const output = getOutput(value);

    if (output === undefined || output === null)
        return "";

    if (typeof output === "string" || typeof output === "number") {
        return output.toString();
    }

    // For objects/arrays, stringify them
    return JSON.stringify(output);
}

/**
 * HTTP Node Executor
 * Performs HTTP requests to external services with configurable parameters.
 *
 * Features:
 * - Support for all standard HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD)
 * - Dynamic URL, headers, query parameters, and body with variable substitution
 * - Configurable timeout
 * - Comprehensive response data including status, headers, and body
 */
export const httpNodeExecutor: NodeExecutor<HttpNodeData> = async ({ node, state }) => {
    // Default timeout of 30 seconds
    const timeout = node.timeout || 30_000;

    // Resolve URL with variable substitution
    const url = resolveHttpValue(node.url, state.getOutput);

    if (!url) {
        throw new Error("HTTP node requires a URL");
    }

    // Build query parameters
    const searchParameters = new URLSearchParams();

    for (const queryParameter of node.query || []) {
        if (queryParameter.key && queryParameter.value !== undefined) {
            const value = resolveHttpValue(queryParameter.value, state.getOutput);

            if (value) {
                searchParameters.append(queryParameter.key, value);
            }
        }
    }

    // Construct final URL with query parameters
    const finalUrl = searchParameters.toString() ? `${url}${url.includes("?") ? "&" : "?"}${searchParameters.toString()}` : url;

    // Build headers
    const headers: Record<string, string> = {};

    for (const header of node.headers || []) {
        if (header.key && header.value !== undefined) {
            const value = resolveHttpValue(header.value, state.getOutput);

            if (value) {
                headers[header.key] = value;
            }
        }
    }

    // Build request body
    let body: string | undefined;

    if (node.body && ["PATCH", "POST", "PUT"].includes(node.method)) {
        body = resolveHttpValue(node.body, state.getOutput);

        // Set default content-type if not specified and body is present
        if (body && !headers["Content-Type"] && !headers["content-type"]) {
            // Try to detect JSON format
            try {
                JSON.parse(body);
                headers["Content-Type"] = "application/json";
            } catch {
                headers["Content-Type"] = "text/plain";
            }
        }
    }

    const startTime = Date.now();

    try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(finalUrl, {
            body,
            headers,
            method: node.method,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse response body as string
        let responseBody: string;

        try {
            responseBody = await response.text();
        } catch {
            // If parsing fails, return empty string
            responseBody = "";
        }

        // Convert response headers to object
        const responseHeaders: Record<string, string> = {};

        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        const duration = Date.now() - startTime;

        const request = {
            body,
            headers,
            method: node.method,
            timeout,
            url: finalUrl,
        };
        const responseData = {
            body: responseBody,
            duration,
            headers: responseHeaders,
            ok: response.ok,
            size: response.headers.get("content-length") ? Number.parseInt(response.headers.get("content-length")!) : undefined,
            status: response.status,
            statusText: response.statusText,
        };

        if (!response.ok) {
            state.setInput(node.id, {
                request,
                response: responseData,
            });
            throw new AppError(response.status.toString(), response.statusText);
        }

        return {
            input: {
                request,
            },
            output: {
                response: responseData,
            },
        };
    } catch (error: any) {
        if (error instanceof AppError) {
            throw error;
        }

        const duration = Date.now() - startTime;

        // Handle different types of errors
        let errorMessage = error.message;
        let errorType = "unknown";

        if (error.name === "AbortError") {
            errorMessage = `Request timeout after ${timeout}ms`;
            errorType = "timeout";
        } else if (error.code === "ENOTFOUND") {
            errorMessage = `DNS resolution failed for ${finalUrl}`;
            errorType = "dns";
        } else if (error.code === "ECONNREFUSED") {
            errorMessage = `Connection refused to ${finalUrl}`;
            errorType = "connection";
        }

        state.setInput(node.id, {
            request: { body, headers, method: node.method, timeout, url: finalUrl },
            response: {
                body: "",
                duration,
                error: {
                    message: errorMessage,
                    type: errorType,
                },
                headers: {},
                ok: false,
                status: 0,
                statusText: errorMessage,
            },
        });
        throw error;
    }
};

/**
 * Template Node Executor
 * Processes text templates with variable substitution using TipTap content.
 *
 * Features:
 * - Variable substitution from previous node outputs
 * - Support for mentions in template content
 * - Simple text output for easy consumption by other nodes
 */
export const templateNodeExecutor: NodeExecutor<TemplateNodeData> = ({ node, state }) => {
    let text: string = "";

    // Convert TipTap template content to text with variable substitution
    if (node.template.type === "tiptap") {
        text = convertTiptapJsonToText({
            getOutput: state.getOutput, // Access to previous node outputs for variable substitution
            json: node.template.tiptap,
        });
    }

    return {
        output: {
            template: text,
        },
    };
};
