import { Agent, ContextOptions, StorageOptions, UsageHandler } from "@convex-dev/agent";
import type { EmbeddingModelV1, LanguageModelV1 } from "@ai-sdk/provider";
import type { LanguageModelRequestMetadata, LanguageModelResponseMetadata, ToolSet } from "ai";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { components } from "../../_generated/api";
import { internal } from "../../_generated/api";
import { ActionCtx } from "../../_generated/server";
import { ConvexError } from "convex/values";
import { Id } from "@cvx/_generated/dataModel";

type RawRequestResponseHandler = (
    ctx: ActionCtx,
    args: {
        userId: string | undefined;
        threadId: string | undefined;
        agentName: string | undefined;
        request: LanguageModelRequestMetadata;
        response: LanguageModelResponseMetadata;
    },
) => void | Promise<void>;

export const agents = {
    // Google's latest and most powerful thinking model
    "gemini-2.5-pro": {
        instructions:
            "You are a highly intelligent assistant with advanced reasoning capabilities. Think through complex problems step by step and provide detailed, accurate responses.",
        textEmbedding: google.textEmbeddingModel("gemini-embedding-exp-03-07"),
        maxSteps: 10,
        maxRetries: 3,
        provider: "google" as const,
        contextOptions: {
            recentMessages: 20,
        },
    },
    // Best price-performance ratio with thinking capabilities
    "gemini-2.5-flash": {
        instructions:
            "You are a helpful and efficient assistant that balances speed with intelligent reasoning. Provide clear, accurate, and well-structured responses.",
        textEmbedding: google.textEmbeddingModel("gemini-embedding-exp-03-07"),
        maxSteps: 8,
        maxRetries: 3,
        provider: "google" as const,
        contextOptions: {
            recentMessages: 15,
        },
    },
    // Most cost-effective option for high-volume tasks
    "gemini-2.5-flash-lite": {
        instructions: "You are an efficient assistant optimized for quick responses. Provide helpful, concise answers while maintaining accuracy.",
        textEmbedding: google.textEmbeddingModel("text-embedding-004"),
        maxSteps: 5,
        maxRetries: 2,
        provider: "google" as const,
        contextOptions: {
            recentMessages: 10,
        },
    },
    // Next-generation model with superior speed and capabilities
    "gemini-2.0-flash": {
        instructions:
            "You are an advanced AI assistant with next-generation capabilities. Provide intelligent, contextually aware responses with superior understanding.",
        textEmbedding: google.textEmbeddingModel("text-embedding-004"),
        maxSteps: 8,
        maxRetries: 3,
        provider: "google" as const,
        contextOptions: {
            recentMessages: 15,
        },
    },
    // Reliable previous generation model
    "gemini-1.5-flash": {
        instructions: "You are a helpful assistant with strong multimodal capabilities. Provide accurate and contextually relevant responses.",
        textEmbedding: google.textEmbeddingModel("text-embedding-004"),
        maxSteps: 6,
        maxRetries: 2,
        provider: "google" as const,
        contextOptions: {
            recentMessages: 12,
        },
    },
    // Legacy OpenAI model for comparison
    "gpt-4o-mini": {
        instructions: "You are a helpful assistant.",
        maxSteps: 5,
        maxRetries: 2,
        provider: "openai" as const,
        contextOptions: {
            recentMessages: 10,
        },
    },
    // Legacy Anthropic model for comparison
    "claude-3-5-sonnet": {
        instructions: "You are a helpful assistant.",
        maxSteps: 6,
        maxRetries: 2,
        provider: "anthropic" as const,
        contextOptions: {
            recentMessages: 12,
        },
    },
} satisfies Record<
    string,
    {
        /**
         * The name for the agent. This will be attributed on each message
         * created by this agent.
         */
        name?: string;
        /**
         * The LLM model to use for generating / streaming text and objects.
         * e.g.
         * import { openai } from "@ai-sdk/openai"
         * const myAgent = new Agent(components.agent, {
         *   chat: openai.chat("gpt-4o-mini"),
         */
        chat?: LanguageModelV1;
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
         * The default system prompt to put in each request.
         * Override per-prompt by passing the "system" parameter.
         */
        instructions?: string;
        /**
         * Tools that the agent can call out to and get responses from.
         * They can be AI SDK tools (import {tool} from "ai")
         * or tools that have Convex context
         * (import { createTool } from "@convex-dev/agent")
         */
        tools?: ToolSet;
        /**
         * Options to determine what messages are included as context in message
         * generation. To disable any messages automatically being added, pass:
         * { recentMessages: 0 }
         */
        contextOptions?: ContextOptions;
        /**
         * Determines whether messages are automatically stored when passed as
         * arguments or generated.
         */
        storageOptions?: StorageOptions;
        /**
         * When generating or streaming text with tools available, this
         * determines the default max number of iterations.
         */
        maxSteps?: number;
        /**
         * The maximum number of calls to make to an LLM in case it fails.
         * This can be overridden at each generate/stream callsite.
         */
        maxRetries?: number;
        /**
         * The usage handler to use for this agent.
         */
        usageHandler?: UsageHandler;
        /**
         * Called for each LLM request/response, so you can do things like
         * log the raw request body or response headers to a table, or logs.
         */
        rawRequestResponseHandler?: RawRequestResponseHandler;
        /**
         * The provider for this model (openai, anthropic, google)
         */
        provider: "openai" | "anthropic" | "google";
    }
>;

export type AgentModel = keyof typeof agents;

// Updated default to use the best price-performance model with thinking capabilities
export const DEFAULT_MODEL: AgentModel = "gemini-2.5-flash";

export function getAgent(model: AgentModel) {
    const agent = agents[model];

    if (!agent) {
        throw new Error(`Unknown agent model: ${model}`);
    }

    let chat: LanguageModelV1;

    if (agent.provider === "openai") {
        chat = openai.chat(model);
    } else if (agent.provider === "anthropic") {
        chat = anthropic.languageModel(model);
    } else if (agent.provider === "google") {
        chat = google.chat(model);
    } else {
        throw new Error(`Unknown agent model: ${model}`);
    }

    return new Agent(components.agent, {
        name: model,
        chat,
        instructions: agent.instructions,
        ...(agent.textEmbedding ? { textEmbedding: agent.textEmbedding } : {}),
        maxSteps: agent.maxSteps,
        maxRetries: agent.maxRetries,
        contextOptions: agent.contextOptions,
    });
}

// Function to create an agent with user-specific API key
export async function getAgentWithUserKey(ctx: ActionCtx, model: AgentModel, userId?: Id<"user">) {
    if (!userId) {
        return getAgent(model);
    }

    const agentConfig = agents[model];

    if (!agentConfig) {
        throw new Error(`Unknown agent model: ${model}`);
    }

    let chat: LanguageModelV1;
    let textEmbedding: EmbeddingModelV1<string> | undefined;

    try {
        const userApiKey = await ctx.runQuery(internal.ai.functions.getDecryptedUserApiKey, {
            userId: userId as Id<"user">,
            provider: agentConfig.provider,
        });

        if (userApiKey) {
            console.log(`Using user's ${agentConfig.provider} API key`);

            // Create provider-specific models with user's API key
            switch (agentConfig.provider) {
                case "openai":
                    const openaiProvider = createOpenAI({ apiKey: userApiKey });
                    chat = openaiProvider.chat(model as any);
                    textEmbedding = openaiProvider.textEmbeddingModel("text-embedding-3-small");

                    break;
                case "anthropic":
                    const anthropicProvider = createAnthropic({ apiKey: userApiKey });
                    chat = anthropicProvider.languageModel(model as any);
                    textEmbedding = anthropicProvider.textEmbeddingModel("text-embedding-004");

                    break;
                case "google":
                    const googleProvider = createGoogleGenerativeAI({ apiKey: userApiKey });
                    chat = googleProvider.chat(model as any);

                    if (agentConfig.textEmbedding) {
                        textEmbedding = googleProvider.textEmbeddingModel("text-embedding-004");
                    }

                    break;
            }
        } else {
            throw new ConvexError(`No user API key found for ${agentConfig.provider}, using system key`);
        }

        return new Agent(components.agent, {
            name: model,
            chat,
            instructions: agentConfig.instructions,
            ...(textEmbedding ? { textEmbedding } : {}),
            maxSteps: agentConfig.maxSteps,
            maxRetries: agentConfig.maxRetries,
            contextOptions: agentConfig.contextOptions,
        });
    } catch (error) {
        throw new ConvexError(`Failed to load user API key for ${agentConfig.provider}, using system key: ${error}`);
    }
}
