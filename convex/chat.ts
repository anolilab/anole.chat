import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, mutation, action, query, httpAction } from "./_generated/server";
import { AgentModel, getAgent } from "./agents";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { vStreamArgs } from "@convex-dev/agent";
import { Id } from "./_generated/dataModel";
import z from "zod";
import type { MessageDoc } from "@convex-dev/agent";

export const createThread = mutation({
    args: {
        model: v.string(),
        sessionToken: v.string(),
    },
    handler: async (ctx, args) => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        const agent = getAgent(args.model as AgentModel);

        const { threadId } = await agent.createThread(ctx, {
            userId: sessionData.userId as Id<"user">,
        });

        return threadId;
    },
});

export const listMessages = query({
    args: {
        threadId: v.string(),
        paginationOpts: paginationOptsValidator,
        model: v.string(),
        sessionToken: v.string(),
    },
    handler: async (ctx, { threadId, paginationOpts, model, sessionToken }): Promise<PaginationResult<MessageDoc>> => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        const agent = getAgent(model as AgentModel);

        const paginated = await agent.listMessages(ctx, {
            threadId,
            paginationOpts,
        });
        return paginated;
    },
});

export const continueThread = action({
    args: { prompt: v.string(), threadId: v.string(), model: v.string(), sessionToken: v.string() },
    handler: async (ctx, { prompt, threadId, model }) => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        const agent = getAgent(model as AgentModel);

        const { thread } = await agent.continueThread(ctx, { threadId, userId: sessionData.userId as Id<"user"> });

        const result = await thread.streamText({ prompt });

        return result.toDataStreamResponse();
    },
});

/*
  export const getThreads = query({
    args: { paginationOpts: paginationOptsValidator },
    handler: async (
      ctx,
      { paginationOpts }
    ): Promise<PaginationResult<ThreadDoc>> => {
      const userId = await getAuthUserId(ctx);
      
      if (!userId) {
        throw new ConvexError("Not authenticated");
      }

      const results = await ctx.runQuery(
        components.agent.threads.listThreadsByUserId,
        { userId, paginationOpts }
      );
      return results;
    },
  });
  */

export const sendMessage = mutation({
    args: { threadId: v.string(), prompt: v.string(), model: v.string(), sessionToken: v.string() },
    handler: async (ctx, { threadId, prompt, model, sessionToken }) => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        const agent = getAgent(model as AgentModel);

        const { messageId } = await agent.saveMessage(ctx, {
            threadId,
            userId: sessionData.userId as Id<"user">,
            prompt,
            skipEmbeddings: true,
        });

        await ctx.scheduler.runAfter(0, internal.chat.generateResponse, {
            threadId,
            promptMessageId: messageId as Id<"messages">,
            model,
            userId: sessionData.userId as Id<"user">,
        });
    },
});

export const generateResponse = internalAction({
    args: {
        threadId: v.string(),
        promptMessageId: v.string(),
        model: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, { threadId, promptMessageId, model, userId }) => {
        const agent = getAgent(model as AgentModel);

        // await agent.generateAndSaveEmbeddings(ctx, { messageIds: [promptMessageId] });

        const { thread } = await agent.continueThread(ctx, { threadId, userId });

        const result = await thread.streamText({ promptMessageId }, { saveStreamDeltas: true });

        await result.consumeStream();
    },
});

export const streamHttpAction = httpAction(async (ctx, request) => {
    const { threadId, prompt, model, sessionToken } = (await request.json()) as {
        threadId?: string;
        prompt: string;
        model: string;
        sessionToken: string;
    };

    const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
        sessionToken,
    });

    if (!sessionData) {
        throw new ConvexError("Unauthorized");
    }

    const agent = getAgent(model as AgentModel);

    const { thread } = threadId
        ? await agent.continueThread(ctx, { threadId, userId: sessionData.userId as Id<"user"> })
        : await agent.createThread(ctx, { userId: sessionData.userId as Id<"user"> });

    const result = await thread.streamText({ prompt });

    return result.toDataStreamResponse();
});

export const createTitleAndSummarizeChat = internalAction({
    args: { threadId: v.string(), lastMessageId: v.optional(v.string()), sessionToken: v.string() },
    handler: async (ctx, args) => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        const agent = getAgent("gemini-1.5-flash");

        const { thread } = await agent.continueThread(ctx, { threadId: args.threadId });
        const threadContext = await agent.fetchContextMessages(ctx, {
            threadId: thread.threadId,
            contextOptions: {},
            userId: sessionData.userId as Id<"user">,
            messages: [],
        });

        const o = await thread.generateObject(
            {
                prompt: `summarize the following thread context, and bring back the title and summary object, ${JSON.stringify(threadContext)}`,
                schema: z.object({
                    title: z.string(),
                    summary: z.string(),
                }),
            },
            {
                storageOptions: {
                    saveMessages: "promptAndOutput",
                },
            },
        );

        const jsonResponse = o.toJsonResponse();

        await thread.updateMetadata(await jsonResponse.json());
    },
});
