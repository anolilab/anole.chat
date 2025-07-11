import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { EmbeddingModelV1, LanguageModelV1 } from "@ai-sdk/provider";
import type { ContextOptions, StorageOptions, UsageHandler } from "@convex-dev/agent";
import { Agent } from "@convex-dev/agent";
import type { LanguageModelRequestMetadata, LanguageModelResponseMetadata, LanguageModelV1Middleware,ToolSet } from "ai";
import { wrapLanguageModel } from "ai";

import { components } from "../../_generated/api";
import type { ActionCtx as ActionContext } from "../../_generated/server";

type RawRequestResponseHandler = (
    context: ActionContext,
    arguments_: {
        agentName: string | undefined;
        request: LanguageModelRequestMetadata;
        response: LanguageModelResponseMetadata;
        threadId: string | undefined;
        userId: string | undefined;
    },
) => void | Promise<void>;

export const agents = {
    // Legacy Anthropic model for comparison
    "claude-3-5-sonnet": {
        chat: anthropic.chat("claude-3-5-sonnet-20240620"),
        contextOptions: {
            recentMessages: 12,
        },
        instructions: "You are a helpful assistant.",
        maxRetries: 2,
        maxSteps: 6,
    },
    // Reliable previous generation model
    "gemini-1.5-flash": {
        chat: google.chat("gemini-1.5-flash"),
        contextOptions: {
            recentMessages: 12,
        },
        instructions: "You are a helpful assistant with strong multimodal capabilities. Provide accurate and contextually relevant responses.",
        maxRetries: 2,
        maxSteps: 6,
        textEmbedding: google.textEmbeddingModel("text-embedding-004"),
    },
    // Next-generation model with superior speed and capabilities
    "gemini-2.0-flash": {
        chat: google.chat("gemini-2.0-flash"),
        contextOptions: {
            recentMessages: 15,
        },
        instructions:
            "You are an advanced AI assistant with next-generation capabilities. Provide intelligent, contextually aware responses with superior understanding.",
        maxRetries: 3,
        maxSteps: 8,
        textEmbedding: google.textEmbeddingModel("text-embedding-004"),
    },
    // Best price-performance ratio with thinking capabilities
    "gemini-2.5-flash": {
        chat: google.chat("gemini-2.5-flash"),
        contextOptions: {
            recentMessages: 15,
        },
        instructions:
            "You are a helpful and efficient assistant that balances speed with intelligent reasoning. Provide clear, accurate, and well-structured responses.",
        maxRetries: 3,
        maxSteps: 8,
        textEmbedding: google.textEmbeddingModel("gemini-embedding-exp-03-07"),
    },
    // Most cost-effective option for high-volume tasks
    "gemini-2.5-flash-lite": {
        chat: google.chat("gemini-2.5-flash-lite"),
        contextOptions: {
            recentMessages: 10,
        },
        instructions: "You are an efficient assistant optimized for quick responses. Provide helpful, concise answers while maintaining accuracy.",
        maxRetries: 2,
        maxSteps: 5,
        textEmbedding: google.textEmbeddingModel("text-embedding-004"),
    },
    // Google's latest and most powerful thinking model
    "gemini-2.5-pro": {
        chat: google.chat("gemini-2.5-pro"),
        contextOptions: {
            recentMessages: 20,
        },
        instructions:
            "You are a highly intelligent assistant with advanced reasoning capabilities. Think through complex problems step by step and provide detailed, accurate responses.",
        maxRetries: 3,
        maxSteps: 10,
        textEmbedding: google.textEmbeddingModel("gemini-embedding-exp-03-07"),
    },
    // Legacy OpenAI model for comparison
    "gpt-4o-mini": {
        chat: openai.chat("gpt-4o-mini"),
        contextOptions: {
            recentMessages: 10,
        },
        instructions: "You are a helpful assistant.",
        maxRetries: 2,
        maxSteps: 5,
    },
} satisfies Record<
    string,
    {
        /**
         * The LLM model to use for generating / streaming text and objects.
         * e.g.
         * import { openai } from "@ai-sdk/openai"
         * const myAgent = new Agent(components.agent, {
         *   chat: openai.chat("gpt-4o-mini"),
         */
        chat: LanguageModelV1;

        /**
         * Options to determine what messages are included as context in message
         * generation. To disable any messages automatically being added, pass:
         * { recentMessages: 0 }
         */
        contextOptions?: ContextOptions;

        /**
         * The default system prompt to put in each request.
         * Override per-prompt by passing the "system" parameter.
         */
        instructions?: string;

        /**
         * The maximum number of calls to make to an LLM in case it fails.
         * This can be overridden at each generate/stream callsite.
         */
        maxRetries?: number;

        /**
         * When generating or streaming text with tools available, this
         * determines the default max number of iterations.
         */
        maxSteps?: number;

        /**
         * The name for the agent. This will be attributed on each message
         * created by this agent.
         */
        name?: string;

        /**
         * Called for each LLM request/response, so you can do things like
         * log the raw request body or response headers to a table, or logs.
         */
        rawRequestResponseHandler?: RawRequestResponseHandler;

        /**
         * Determines whether messages are automatically stored when passed as
         * arguments or generated.
         */
        storageOptions?: StorageOptions;

        /**
         * The model to use for text embeddings. Optional.
         * If specified, it will use this for generating vector embeddings
         * of chats, and can opt-in to doing vector search for automatic context
         * on generateText, etc.
         * e.g.
         * import { openai } from "@ai-sdk/openai"
         * const myAgent = new Agent(components.agent, {
         *   textEmbedding: openai.embedding("text-embedding-3-small")
         */
        textEmbedding?: EmbeddingModelV1<string>;

        /**
         * Tools that the agent can call out to and get responses from.
         * They can be AI SDK tools (import {tool} from "ai")
         * or tools that have Convex context
         * (import { createTool } from "@convex-dev/agent")
         */
        tools?: ToolSet;

        /**
         * The usage handler to use for this agent.
         */
        usageHandler?: UsageHandler;
    }
>;

export type AgentModel = keyof typeof agents;

// Updated default to use the best price-performance model with thinking capabilities
export const DEFAULT_MODEL: AgentModel = "gemini-2.5-flash";

export function getAgent(
    model: AgentModel,
    options?: {
        middleware?: LanguageModelV1Middleware | LanguageModelV1Middleware[];
        modelId?: string;
        providerId?: string;
    },
) {
    const agent = agents[model];

    if (!agent) {
        throw new Error(`Unknown agent model: ${model}`);
    }

    let { chat } = agent;

    if (options !== undefined) {
        chat = wrapLanguageModel({
            middleware: 
                (Array.isArray(options.middleware) ? options.middleware : [options.middleware]).filter(Boolean) as LanguageModelV1Middleware[],
            model: chat,
            modelId: options.modelId,
            providerId: options.providerId,
        });
    }

    return new Agent(components.agent, {
        chat,
        instructions: agent.instructions,
    });
}
