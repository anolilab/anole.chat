import { ConvexError, v } from "convex/values";
import { components, internal } from "./_generated/api";
import { internalAction, internalMutation, mutation, action, query, httpAction, internalQuery } from "./_generated/server";
import { AgentModel, getAgent } from "./agents";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { Id } from "./_generated/dataModel";
import z from "zod";
import type { MessageDoc, ThreadDoc } from "@convex-dev/agent";

export const createThread = mutation({
    args: {
        model: v.string(),
        sessionToken: v.string(),
        parentThreadId: v.optional(v.string()),
        branchPoint: v.optional(v.number()),
        branchName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        const agent = getAgent(args.model as AgentModel);

        // Create the thread using the standard agent API
        const createOptions = {
            userId: sessionData.userId as Id<"user">,
            title: args.branchName || undefined,
        };

        const { threadId } = await agent.createThread(ctx, createOptions);
        // TODO: Fix upstream - @convex-dev/agent createThread doesn't support parentThreadIds
        // The agent's createThread function signature doesn't include parentThreadIds parameter
        // Once this is added upstream, we can pass parentThreadIds directly in createOptions above
        // Create thread relationship if this is a branch
        if (args.parentThreadId) {
            await ctx.runMutation(internal.chat.createThreadRelationship, {
                threadId,
                parentThreadId: args.parentThreadId,
                branchPoint: args.branchPoint || 0,
                branchType: "branch",
            });
        }

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

        // Check if this thread has a parent (is a branch)
        const threadRelationship = await ctx.runQuery(internal.chat.getThreadRelationship, {
            threadId,
        });

        if (threadRelationship) {
            // Get parent messages up to the branch point
            const parentMessages = await agent.listMessages(ctx, {
                threadId: threadRelationship.parentThreadId,
                paginationOpts: { numItems: 1000, cursor: null },
            });

            // Get current thread messages
            const currentMessages = await agent.listMessages(ctx, {
                threadId,
                paginationOpts: { numItems: 1000, cursor: null },
            });

            // Take only parent messages up to the branch point (inclusive)
            const parentMessagesUpToBranch = parentMessages.page.slice(0, (threadRelationship.branchPoint || 0) + 1);

            // Merge parent messages with current thread messages
            const mergedMessages = [...parentMessagesUpToBranch, ...currentMessages.page];

            // Apply pagination to the merged result
            const startIndex = paginationOpts.cursor ? mergedMessages.findIndex((m) => m._id === paginationOpts.cursor) + 1 : 0;
            const endIndex = Math.min(startIndex + paginationOpts.numItems, mergedMessages.length);
            const paginatedMessages = mergedMessages.slice(startIndex, endIndex);

            return {
                page: paginatedMessages,
                isDone: endIndex >= mergedMessages.length,
                continueCursor: endIndex < mergedMessages.length ? mergedMessages[endIndex - 1]?._id || null : null,
            };
        }

        // If no parent, return current messages with original pagination
        const paginated = await agent.listMessages(ctx, {
            threadId,
            paginationOpts,
        });

        return paginated;
    },
});

export const continueThread = action({
    args: { prompt: v.string(), threadId: v.string(), model: v.string(), sessionToken: v.string() },
    handler: async (ctx, { prompt, threadId, model, sessionToken }) => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken,
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

// DEPRECATED: Use deleteThreadWithRelationships instead
export const deleteThread = mutation({
    args: { threadId: v.string(), sessionToken: v.string() },
    handler: async (ctx, { threadId, sessionToken }) => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        // Clean up relationships first
        await ctx.runMutation(internal.chat.deleteThreadRelationship, {
            threadId,
        });

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

// Thread relationship management functions

export const createThreadRelationship = internalMutation({
    args: {
        threadId: v.string(),
        parentThreadId: v.string(),
        branchPoint: v.optional(v.number()),
        branchType: v.optional(v.union(v.literal("branch"), v.literal("continuation"))),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("threadRelationships", {
            threadId: args.threadId,
            parentThreadId: args.parentThreadId,
            branchPoint: args.branchPoint || 0,
            branchType: args.branchType || "branch",
            createdAt: Date.now(),
        });
    },
});

export const getThreadRelationship = internalQuery({
    args: {
        threadId: v.string(),
    },
    handler: async (ctx, args) => {
        const relationship = await ctx.db
            .query("threadRelationships")
            .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
            .unique();

        return relationship;
    },
});

export const getChildThreads = query({
    args: {
        parentThreadId: v.string(),
        sessionToken: v.string(),
    },
    handler: async (ctx, args) => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        // Get all child threads for this parent
        const relationships = await ctx.db
            .query("threadRelationships")
            .withIndex("by_parent", (q) => q.eq("parentThreadId", args.parentThreadId))
            .collect();

        // Get the actual thread data for each child
        const childThreads = [];
        for (const relationship of relationships) {
            const thread = await ctx.runQuery(components.agent.threads.getThread, {
                threadId: relationship.threadId,
            });
            if (thread) {
                childThreads.push({
                    ...thread,
                    branchPoint: relationship.branchPoint,
                    branchType: relationship.branchType,
                    createdAt: relationship.createdAt,
                });
            }
        }

        return childThreads;
    },
});

export const deleteThreadRelationship = internalMutation({
    args: {
        threadId: v.string(),
    },
    handler: async (ctx, args) => {
        const relationship = await ctx.db
            .query("threadRelationships")
            .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
            .unique();

        if (relationship) {
            await ctx.db.delete(relationship._id);
        }
    },
});

// Update deleteThread to also clean up relationships
export const deleteThreadWithRelationships = mutation({
    args: { threadId: v.string(), sessionToken: v.string() },
    handler: async (ctx, { threadId, sessionToken }) => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        // Delete the thread relationship
        await ctx.runMutation(internal.chat.deleteThreadRelationship, {
            threadId,
        });

        // Delete the actual thread
        return await ctx.runMutation(components.agent.threads.deleteAllForThreadIdAsync, { threadId });
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

export const getAllThreadRelationships = query({
    args: {
        sessionToken: v.string(),
    },
    handler: async (ctx, args) => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        // Get all thread relationships for building the hierarchy
        const relationships = await ctx.db.query("threadRelationships").collect();

        return relationships;
    },
});
