import { Agent, ContextOptions, StorageOptions, UsageHandler } from "@convex-dev/agent";
import type { EmbeddingModelV1, LanguageModelV1 } from "@ai-sdk/provider";
import type { LanguageModelRequestMetadata, LanguageModelResponseMetadata, ToolSet } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { components } from "./_generated/api";
import { ActionCtx } from "./_generated/server";

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
    "gpt-4o-mini": {
        chat: openai.chat("gpt-4o-mini"),
        instructions: "You are a helpful assistant.",
    },
    "claude-3-5-sonnet": {
        chat: anthropic.chat("claude-3-5-sonnet-20240620"),
        instructions: "You are a helpful assistant.",
    },
    "gemini-1.5-flash": {
        chat: google.chat("gemini-1.5-flash-latest"),
        instructions: "You are a helpful assistant.",
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
        chat: LanguageModelV1;
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
    }
>;

export type AgentModel = keyof typeof agents;

export const DEFAULT_MODEL: AgentModel = "gemini-1.5-flash";

export function getAgent(model: AgentModel) {
    const agent = agents[model];

    if (!agent) {
        throw new Error(`Unknown agent model: ${model}`);
    }

    return new Agent(components.agent, {
        chat: agent.chat,
        instructions: agent.instructions,
    });
}
