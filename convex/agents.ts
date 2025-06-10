import { Agent } from "@convex-dev/agent";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { components } from "./_generated/api";

export const agents = {
    "gpt-4o-mini": new Agent(components.agent, {
        chat: openai.chat("gpt-4o-mini"),
        instructions: "You are a helpful assistant.",
    }),
    "claude-3-5-sonnet": new Agent(components.agent, {
        chat: anthropic.chat("claude-3-5-sonnet-20240620"),
        instructions: "You are a helpful assistant.",
    }),
    "gemini-1.5-flash": new Agent(components.agent, {
        chat: google.chat("gemini-1.5-flash-latest"),
        instructions: "You are a helpful assistant.",
    }),
};

export type AgentModel = keyof typeof agents;

export function getAgent(model: AgentModel) {
    const agent = agents[model];
    if (!agent) {
        throw new Error(`Unknown agent model: ${model}`);
    }
    return agent;
}
