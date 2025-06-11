import { ConvexError, v } from "convex/values";
import { components, internal } from "./_generated/api";
import { internalAction, mutation, action, query, httpAction } from "./_generated/server";
import { AgentModel, getAgent } from "./agents";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { Id } from "./_generated/dataModel";
import z from "zod";
import type { MessageDoc, ThreadDoc } from "@convex-dev/agent";

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

export const getThreads = query({
    args: { sessionToken: v.string(), paginationOpts: paginationOptsValidator },
    handler: async (ctx, { sessionToken, paginationOpts }): Promise<PaginationResult<ThreadDoc>> => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        const results = await ctx.runQuery(components.agent.threads.listThreadsByUserId, { userId: sessionData.userId as Id<"user">, paginationOpts });

        return results;
    },
});

export const updateThread = mutation({
    args: {
        threadId: v.string(),
        title: v.optional(v.string()),
        summary: v.optional(v.string()),
        order: v.optional(v.number()),
        status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
        model: v.string(),
        sessionToken: v.string(),
    },
    handler: async (ctx, { threadId, title, sessionToken, model, summary, order, status }) => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        const agent = getAgent(model as AgentModel);

        const { thread } = await agent.continueThread(ctx, { threadId, userId: sessionData.userId as Id<"user"> });

        await thread.updateMetadata({ title, summary, order, status });

        return thread.threadId;
    },
});

export const deleteThread = mutation({
    args: { threadId: v.string(), sessionToken: v.string() },
    handler: async (ctx, { threadId, sessionToken }) => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        return await ctx.runMutation(components.agent.threads.deleteAllForThreadIdAsync, { threadId });
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

    await ctx.scheduler.runAfter(0, internal.chat.createTitleChat, {
        threadId: thread.threadId,
        sessionToken,
        prompt,
    });

    await ctx.scheduler.runAfter(0, internal.chat.createSummarizeChat, {
        threadId: thread.threadId,
        sessionToken,
    });

    const result = await thread.streamText({ prompt });

    return result.toDataStreamResponse();
});

export const createTitleChat = internalAction({
    args: { threadId: v.string(), prompt: v.string(), sessionToken: v.string() },
    handler: async (ctx, args) => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        const agent = getAgent("gemini-1.5-flash");

        const { thread } = await agent.continueThread(ctx, { threadId: args.threadId });

        const o = await thread.generateObject(
            {
                prompt: `summarize the following thread prompt into a short title, and bring back the title object, ${JSON.stringify(args.prompt)}`,
                schema: z.object({ title: z.string() }),
            },
            {
                storageOptions: {
                    saveMessages: "none",
                },
            },
        );

        const jsonResponse = o.toJsonResponse();

        await thread.updateMetadata(await jsonResponse.json());
    },
});

export const createSummarizeChat = internalAction({
    args: { threadId: v.string(), sessionToken: v.string() },
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
                prompt: `summarize the following thread context, and bring back the summary object, ${JSON.stringify(threadContext)}`,
                schema: z.object({ summary: z.string() }),
            },
            {
                storageOptions: {
                    saveMessages: "none",
                },
            },
        );

        const jsonResponse = o.toJsonResponse();

        await thread.updateMetadata(await jsonResponse.json());
    },
});
