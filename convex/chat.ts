import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, mutation, query } from "./_generated/server";
import { AgentModel, getAgent } from "./agents";
import { paginationOptsValidator } from "convex/server";
import { vStreamArgs } from "@convex-dev/agent";
import { Id } from "./_generated/dataModel";

export const start = mutation({
  args: {
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = getAgent(args.model as AgentModel);
    
    const { threadId } = await agent.createThread(ctx);

    return threadId;
  },
});

export const sendMessage = mutation({
  args: { threadId: v.id("threads"), prompt: v.string(), model: v.string() },
  handler: async (ctx, { threadId, prompt, model }) => {
    const agent = getAgent(model as AgentModel);
    const { messageId } = await agent.saveMessage(ctx, {
      threadId,
      prompt,
      skipEmbeddings: true,
    });
    await ctx.scheduler.runAfter(0, internal.chat.generateResponse, {
      threadId,
      // @ts-ignore - TODO: fix this
      promptMessageId: messageId as Id<"messages">,
      model,
    });
  },
});

export const generateResponse = internalAction({
  args: {
    threadId: v.id("threads"),
    promptMessageId: v.id("messages"),
    model: v.string(),
  },
  handler: async (ctx, { threadId, promptMessageId, model }) => {
    const agent = getAgent(model as AgentModel);
    const { thread } = await agent.continueThread(ctx, { threadId });
    const result = await thread.streamText(
      { promptMessageId },
      { saveStreamDeltas: true },
    );
    await result.consumeStream();
  },
});

export const getMessages = query({
  args: {
    threadId: v.optional(v.id("threads")),
    paginationOpts: v.optional(paginationOptsValidator),
    streamArgs: v.optional(vStreamArgs),
  },
  handler: async (ctx, args) => {
    if (!args.threadId) {
      return { page: [], isDone: true, continueCursor: "", streams: [] };
    }
    const agent = getAgent("gpt-4o-mini"); // Agent doesn't matter for listing
    const streams = await agent.syncStreams(ctx, {
      threadId: args.threadId,
      streamArgs: args.streamArgs,
    });
    const paginated = await agent.listMessages(ctx, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts ?? { numItems: 100, cursor: null },
    });
    return {
      ...paginated,
      streams,
    };
  },
}); 