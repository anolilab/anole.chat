import type { Tool } from "ai";
import { z } from "zod/v4";

export const MCPRemoteConfigZodSchema = z
    .object({
        headers: z.record(z.string(), z.string()).optional(),
        url: z.string().url().describe("The URL of the SSE endpoint"),
    })
    .strict();

export const MCPStdioConfigZodSchema = z
    .object({
        args: z.array(z.string()).optional(),
        command: z.string().min(1).describe("The command to run"),
        env: z.record(z.string(), z.string()).optional(),
    })
    .strict();

export const AllowedMCPServerZodSchema = z
    .object({
        tools: z.array(z.string()),
        // resources: z.array(z.string()).optional(),
    })
    .strict();

export type AllowedMCPServer = z.infer<typeof AllowedMCPServerZodSchema>;

export type MCPRemoteConfig = z.infer<typeof MCPRemoteConfigZodSchema>;
export type MCPStdioConfig = z.infer<typeof MCPStdioConfigZodSchema>;

export type MCPServerConfig = MCPRemoteConfig | MCPStdioConfig;

export type MCPToolInfo = {
    description: string;
    inputSchema?: {
        properties?: Record<string, any>;
        required?: string[];
        type?: any;
    };
    name: string;
};

export type MCPServerInfo = {
    config: MCPServerConfig;
    error?: unknown;
    name: string;
    status: "connected" | "disconnected" | "loading";
    toolInfo: MCPToolInfo[];
};

export type McpServerInsert = {
    config: MCPServerConfig;
    id?: string;
    name: string;
};
export type McpServerSelect = {
    config: MCPServerConfig;
    id: string;
    name: string;
};

export type VercelAIMcpTool = Tool & {
    __$ref__: "mcp";
    _mcpServerId: string;
    _mcpServerName: string;
    _originToolName: string;
};

export interface MCPRepository {
    deleteById: (id: string) => Promise<void>;
    existsByServerName: (name: string) => Promise<boolean>;
    save: (server: McpServerInsert) => Promise<McpServerSelect>;
    selectAll: () => Promise<McpServerSelect[]>;
    selectById: (id: string) => Promise<McpServerSelect | null>;
    selectByServerName: (name: string) => Promise<McpServerSelect | null>;
}

export const McpToolCustomizationZodSchema = z
    .object({
        mcpServerId: z.string().min(1),
        prompt: z.string().max(1000).optional().nullable(),
        toolName: z.string().min(1),
    })
    .strict();

export type McpToolCustomization = {
    id: string;
    mcpServerId: string;
    prompt?: string | null;
    toolName: string;
    userId: string;
};

export type McpToolCustomizationRepository = {
    deleteToolCustomization: (key: { mcpServerId: string; toolName: string; userId: string }) => Promise<void>;
    select: (key: { mcpServerId: string; toolName: string; userId: string }) => Promise<McpToolCustomization | null>;
    selectByUserId: (userId: string) => Promise<(McpToolCustomization & { serverName: string })[]>;
    selectByUserIdAndMcpServerId: (key: { mcpServerId: string; userId: string }) => Promise<McpToolCustomization[]>;
    upsertToolCustomization: (data: PartialBy<McpToolCustomization, "id">) => Promise<McpToolCustomization>;
};

export const McpServerCustomizationZodSchema = z
    .object({
        mcpServerId: z.string().min(1),
        prompt: z.string().max(3000).optional().nullable(),
    })
    .strict();

export type McpServerCustomization = {
    id: string;
    mcpServerId: string;
    prompt?: string | null;
    userId: string;
};

export type McpServerCustomizationRepository = {
    deleteMcpServerCustomizationByMcpServerIdAndUserId: (key: { mcpServerId: string; userId: string }) => Promise<void>;
    selectByUserId: (userId: string) => Promise<(McpServerCustomization & { serverName: string })[]>;
    selectByUserIdAndMcpServerId: (key: { mcpServerId: string; userId: string }) => Promise<(McpServerCustomization & { serverName: string }) | null>;
    upsertMcpServerCustomization: (data: PartialBy<McpServerCustomization, "id">) => Promise<McpServerCustomization>;
};

export type McpServerCustomizationsPrompt = {
    id: string;
    name: string;
    prompt?: string;
    tools?: {
        [toolName: string]: string;
    };
};

const TextContent = z
    .object({
        _meta: z.object({}).passthrough().optional(),
        text: z.string(),
        type: z.literal("text"),
    })
    .strict();

const ImageContent = z
    .object({
        _meta: z.object({}).passthrough().optional(),
        data: z.string(),
        mimeType: z.string(),
        type: z.literal("image"),
    })
    .strict();

const AudioContent = z
    .object({
        _meta: z.object({}).passthrough().optional(),
        data: z.string(),
        mimeType: z.string(),
        type: z.literal("audio"),
    })
    .strict();

const ResourceLinkContent = z
    .object({
        _meta: z.object({}).passthrough().optional(),
        description: z.string().optional(),
        mimeType: z.string().optional(),
        name: z.string(),
        title: z.string().optional(),
        type: z.literal("resource_link"),
        uri: z.string(),
    })
    .strict();

const ResourceText = z
    .object({
        _meta: z.object({}).passthrough().optional(),
        mimeType: z.string().optional(),
        text: z.string(),
        uri: z.string(),
    })
    .strict();

const ResourceBlob = z
    .object({
        _meta: z.object({}).passthrough().optional(),
        blob: z.string(),
        mimeType: z.string().optional(),
        uri: z.string(),
    })
    .strict();

const ResourceContent = z
    .object({
        _meta: z.object({}).passthrough().optional(),
        resource: z.union([ResourceText, ResourceBlob]),
        type: z.literal("resource"),
    })
    .strict();

const ContentUnion = z.union([TextContent, ImageContent, AudioContent, ResourceLinkContent, ResourceContent]);

export const CallToolResultSchema = z
    .object({
        _meta: z.object({}).passthrough().optional(),
        content: z.array(ContentUnion).default([]),
        isError: z.boolean().optional(),
        structuredContent: z.object({}).passthrough().optional(),
    })
    .strict();

export type CallToolResult = z.infer<typeof CallToolResultSchema>;
