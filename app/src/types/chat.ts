import type { Message, UIMessage } from "ai";
import { z } from "zod/v4";

import { AllowedMCPServerZodSchema } from "./mcp";
import type { UserPreferences } from "./user";

export type ChatModel = {
    model: string;
    provider: string;
};

export type ChatThread = {
    createdAt: Date;
    id: string;
    projectId: string | null;
    title: string;
    userId: string;
};

export type Project = {
    createdAt: Date;
    id: string;
    instructions: {
        systemPrompt: string;
    };
    name: string;
    updatedAt: Date;
    userId: string;
};

export type ChatMessage = {
    annotations?: ChatMessageAnnotation[];
    attachments?: unknown[];
    createdAt: Date;
    id: string;
    model: string | null;
    parts: UIMessage["parts"];
    role: UIMessage["role"];
    threadId: string;
};

export const ChatMentionSchema = z.discriminatedUnion("type", [
    z
        .object({
            description: z.string().optional(),
            name: z.string(),
            serverId: z.string(),
            serverName: z.string().optional(),
            type: z.literal("mcpTool"),
        })
        .strict(),
    z
        .object({
            description: z.string().optional(),
            label: z.string(),
            name: z.string(),
            type: z.literal("defaultTool"),
        })
        .strict(),
    z
        .object({
            description: z.string().optional(),
            name: z.string(),
            serverId: z.string(),
            toolCount: z.number().optional(),
            type: z.literal("mcpServer"),
        })
        .strict(),
    z
        .object({
            description: z.string().optional(),
            icon: z
                .object({
                    style: z.record(z.string(), z.string()).optional(),
                    type: z.literal("emoji"),
                    value: z.string(),
                })
                .optional(),
            name: z.string(),
            type: z.literal("workflow"),
            workflowId: z.string(),
        })
        .strict(),
]);

export type ChatMention = z.infer<typeof ChatMentionSchema>;

export type ChatMessageAnnotation = {
    [key: string]: any;
    toolChoice?: "auto" | "none" | "manual";
    usageTokens?: number;
};

export const chatApiSchemaRequestBodySchema = z
    .object({
        allowedAppDefaultToolkit: z.array(z.string()).optional(),
        allowedMcpServers: z.record(z.string(), AllowedMCPServerZodSchema).optional(),
        autoTitle: z.boolean().optional(),
        chatModel: z
            .object({
                model: z.string(),
                provider: z.string(),
            })
            .optional(),
        id: z.string(),
        mentions: z.array(ChatMentionSchema).optional(),
        message: z.any() as z.ZodType<UIMessage>,
        projectId: z.string().optional(),
        toolChoice: z.enum(["auto", "none", "manual"]),
    })
    .strict();

export type ChatApiSchemaRequestBody = z.infer<typeof chatApiSchemaRequestBodySchema>;

export type ToolInvocationUIPart = Extract<Exclude<Message["parts"], undefined>[number], { type: "tool-invocation" }>;

export type ChatRepository = {
    deleteAllThreads: (userId: string) => Promise<void>;

    deleteChatMessage: (id: string) => Promise<void>;

    deleteMessagesByChatIdAfterTimestamp: (messageId: string) => Promise<void>;

    deleteNonProjectThreads: (userId: string) => Promise<void>;

    deleteProject: (id: string) => Promise<void>;
    deleteThread: (id: string) => Promise<void>;

    insertMessage: (message: Omit<ChatMessage, "createdAt">) => Promise<ChatMessage>;

    insertMessages: (messages: PartialBy<ChatMessage, "createdAt">[]) => Promise<ChatMessage[]>;

    insertProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => Promise<Project>;

    insertThread: (thread: Omit<ChatThread, "createdAt">) => Promise<ChatThread>;

    selectMessagesByThreadId: (threadId: string) => Promise<ChatMessage[]>;

    selectProjectById: (id: string) => Promise<
        | (Project & {
            threads: ChatThread[];
        })
        | null
    >;
    selectProjectsByUserId: (userId: string) => Promise<Omit<Project, "instructions">[]>;

    selectThread: (id: string) => Promise<ChatThread | null>;

    selectThreadDetails: (id: string) => Promise<
        | (ChatThread & {
            instructions: Project["instructions"] | null;
            messages: ChatMessage[];
            userPreferences?: UserPreferences;
        })
        | null
    >;
    selectThreadInstructions: (
        userId: string,
        threadId?: string,
    ) => Promise<{
        instructions: Project["instructions"] | null;
        projectId?: string;
        threadId?: string;
        userPreferences?: UserPreferences;
    }>;

    selectThreadInstructionsByProjectId: (
        userId: string,
        projectId?: string,
    ) => Promise<{
        instructions: Project["instructions"] | null;
        userPreferences?: UserPreferences;
    }>;

    selectThreadsByUserId: (userId: string) => Promise<
        (ChatThread & {
            lastMessageAt: number;
        })[]
    >;

    updateProject: (id: string, project: Partial<Pick<Project, "name" | "instructions">>) => Promise<Project>;

    updateThread: (id: string, thread: Partial<Omit<ChatThread, "id" | "createdAt">>) => Promise<ChatThread>;

    upsertMessage: (message: Omit<ChatMessage, "createdAt">) => Promise<ChatMessage>;

    upsertThread: (thread: PartialBy<Omit<ChatThread, "createdAt">, "projectId" | "userId">) => Promise<ChatThread>;
};

export const ClientToolInvocationZodSchema = z
    .object({
        action: z.enum(["manual", "direct"]),
        result: z.any().optional(),
    })
    .strict();

export type ClientToolInvocation = z.infer<typeof ClientToolInvocationZodSchema>;
