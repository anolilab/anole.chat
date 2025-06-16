import { ConvexError, v } from "convex/values";
import { components, internal } from "../_generated/api";
import { internalAction, internalMutation, mutation, action, query, httpAction, internalQuery } from "../_generated/server";
import { AgentModel, getAgent } from "../ai/lib/agents";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { Id } from "../_generated/dataModel";
import z from "zod";
import type { MessageDoc, ThreadDoc } from "@convex-dev/agent";
import { checkRateLimit, getRateLimitName } from "../lib/rateLimiter";

export const createThread = mutation({
    args: {
        model: v.string(),
        sessionToken: v.string(),
        parentThreadId: v.optional(v.string()),
        branchPoint: v.optional(v.number()),
        branchName: v.optional(v.string()),
    },
    returns: v.string(),
    handler: async (ctx, args) => {
        const sessionData: any | null = await ctx.runQuery(internal.betterAuth.getSession, {
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

        const { threadId }: { threadId: string } = await agent.createThread(ctx, createOptions);
        // TODO: Fix upstream - @convex-dev/agent createThread doesn't support parentThreadIds
        // The agent's createThread function signature doesn't include parentThreadIds parameter
        // Once this is added upstream, we can pass parentThreadIds directly in createOptions above
        // Create thread relationship if this is a branch
        if (args.parentThreadId) {
            await ctx.runMutation(internal.chat.functions.createThreadRelationship, {
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
        const threadRelationship = await ctx.runQuery(internal.chat.functions.getThreadRelationship, {
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
                continueCursor: endIndex < mergedMessages.length ? (mergedMessages[endIndex - 1]?._id ?? "") : "",
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
        const sessionData: any | null = await ctx.runQuery(internal.betterAuth.getSession, {
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
        const sessionData: any | null = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        const results = await ctx.runQuery(components.agent.threads.listThreadsByUserId, { userId: sessionData.userId as Id<"user">, paginationOpts });

        return results;
    },
});

export const updateThread = action({
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
        const sessionData: any | null = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        const agent = getAgent(model as AgentModel);

        const { thread } = await agent.continueThread(ctx, { threadId, userId: sessionData.userId as Id<"user"> });

        await thread.updateMetadata({ title, summary, status });

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
        await ctx.runMutation(internal.chat.functions.deleteThreadRelationship, {
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

    await ctx.scheduler.runAfter(0, internal.chat.functions.createTitleChat, {
        threadId: thread.threadId,
        sessionToken,
        prompt,
    });

    await ctx.scheduler.runAfter(0, internal.chat.functions.createSummarizeChat, {
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

        const metaData = await thread.getMetadata();

        if (!metaData.title) {
            return;
        }

        const o = await thread.generateObject(
            {
                prompt: `Generate a concise, 4-5 word title for a new conversation that captures the core topic of this user's prompt. Do not use quotation marks in the title. User prompt: "${args.prompt}"`,
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
        await ctx.runMutation(internal.chat.functions.deleteThreadRelationship, {
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
                prompt: `Summarize the key points of the following conversation in a single, concise sentence. Conversation: ${JSON.stringify(threadContext)}`,
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

export const validateThreadExists = query({
    args: {
        threadId: v.string(),
        sessionToken: v.string(),
    },
    handler: async (ctx, args) => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        try {
            // Check if the thread exists using the agent API
            const thread = await ctx.runQuery(components.agent.threads.getThread, {
                threadId: args.threadId,
            });

            return thread !== null;
        } catch (error) {
            // If thread doesn't exist or any error occurs, return false
            return false;
        }
    },
});

// Pin/Unpin thread functionality

export const pinThread = mutation({
    args: {
        threadId: v.string(),
        sessionToken: v.string(),
    },
    handler: async (ctx, args) => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        // Check if thread is already pinned
        const existingPin = await ctx.db
            .query("pinnedThreads")
            .withIndex("by_user_and_thread", (q) => q.eq("userId", sessionData.userId as Id<"user">).eq("threadId", args.threadId))
            .unique();

        if (existingPin) {
            throw new ConvexError("Thread is already pinned");
        }

        // Verify thread exists
        const threadExists = await ctx.runQuery(components.agent.threads.getThread, {
            threadId: args.threadId,
        });

        if (!threadExists) {
            throw new ConvexError("Thread not found");
        }

        // Pin the thread
        await ctx.db.insert("pinnedThreads", {
            userId: sessionData.userId as Id<"user">,
            threadId: args.threadId,
            pinnedAt: Date.now(),
        });

        return { success: true };
    },
});

export const unpinThread = mutation({
    args: {
        threadId: v.string(),
        sessionToken: v.string(),
    },
    handler: async (ctx, args) => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        // Find the pinned thread record
        const pinnedThread = await ctx.db
            .query("pinnedThreads")
            .withIndex("by_user_and_thread", (q) => q.eq("userId", sessionData.userId as Id<"user">).eq("threadId", args.threadId))
            .unique();

        if (!pinnedThread) {
            throw new ConvexError("Thread is not pinned");
        }

        // Unpin the thread
        await ctx.db.delete(pinnedThread._id);

        return { success: true };
    },
});

export const getPinnedThreads = query({
    args: {
        sessionToken: v.string(),
    },
    returns: v.array(v.any()),
    handler: async (ctx, args) => {
        const sessionData: any | null = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        // Get all pinned threads for the user
        const pinnedThreads = await ctx.db
            .query("pinnedThreads")
            .withIndex("by_user", (q) => q.eq("userId", sessionData.userId as Id<"user">))
            .collect();

        return pinnedThreads;
    },
});

export const isThreadPinned = query({
    args: {
        threadId: v.string(),
        sessionToken: v.string(),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const sessionData: any | null = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        // Check if thread is pinned
        const pinnedThread = await ctx.db
            .query("pinnedThreads")
            .withIndex("by_user_and_thread", (q) => q.eq("userId", sessionData.userId as Id<"user">).eq("threadId", args.threadId))
            .unique();

        return pinnedThread !== null;
    },
});

// Thread ordering functionality

export const updateThreadOrder = mutation({
    args: {
        threadOrders: v.array(
            v.object({
                threadId: v.string(),
                order: v.number(),
            }),
        ),
        sessionToken: v.string(),
    },
    handler: async (ctx, args) => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        const userId = sessionData.userId as Id<"user">;
        const now = Date.now();

        // Update or insert thread orders
        for (const { threadId, order } of args.threadOrders) {
            // Check if order already exists
            const existingOrder = await ctx.db
                .query("threadOrder")
                .withIndex("by_user_and_thread", (q) => q.eq("userId", userId).eq("threadId", threadId))
                .unique();

            if (existingOrder) {
                // Update existing order
                await ctx.db.patch(existingOrder._id, {
                    order,
                    updatedAt: now,
                });
            } else {
                // Insert new order
                await ctx.db.insert("threadOrder", {
                    userId,
                    threadId,
                    order,
                    updatedAt: now,
                });
            }
        }

        return { success: true };
    },
});

export const getThreadOrders = query({
    args: {
        sessionToken: v.string(),
    },
    returns: v.array(v.any()),
    handler: async (ctx, args) => {
        const sessionData: any | null = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        // Get all thread orders for the user
        const threadOrders = await ctx.db
            .query("threadOrder")
            .withIndex("by_user", (q) => q.eq("userId", sessionData.userId as Id<"user">))
            .collect();

        return threadOrders;
    },
});

export const searchThreads = query({
    args: {
        searchQuery: v.string(),
        sessionToken: v.string(),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, { searchQuery, sessionToken, paginationOpts }): Promise<PaginationResult<ThreadDoc>> => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        const userId = sessionData.userId as Id<"user">;

        // Get all threads for the user
        const allThreads = await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
            userId,
            paginationOpts: { numItems: 1000, cursor: null }, // Get all threads for filtering
        });

        // If no search query, return regular threads with pagination
        if (!searchQuery.trim()) {
            return await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
                userId,
                paginationOpts,
            });
        }

        // Filter threads by title and summary (client-side for now, as agent doesn't have thread search)
        const query = searchQuery.toLowerCase();
        const filteredThreads = allThreads.page.filter((thread) => {
            const titleMatch = thread.title?.toLowerCase().includes(query);
            const summaryMatch = thread.summary?.toLowerCase().includes(query);
            return titleMatch || summaryMatch;
        });

        // Sort by relevance (title matches first, then summary matches, then by creation time)
        filteredThreads.sort((a, b) => {
            const aTitleMatch = a.title?.toLowerCase().includes(query);
            const bTitleMatch = b.title?.toLowerCase().includes(query);

            // Title matches come first
            if (aTitleMatch && !bTitleMatch) return -1;
            if (!aTitleMatch && bTitleMatch) return 1;

            // Then by creation time (newest first)
            return b._creationTime - a._creationTime;
        });

        // Apply pagination to filtered results
        const startIndex = paginationOpts.cursor ? filteredThreads.findIndex((t) => t._id === paginationOpts.cursor) + 1 : 0;
        const endIndex = Math.min(startIndex + paginationOpts.numItems, filteredThreads.length);
        const paginatedThreads = filteredThreads.slice(startIndex, endIndex);

        return {
            page: paginatedThreads,
            isDone: endIndex >= filteredThreads.length,
            continueCursor: filteredThreads[endIndex - 1]._id,
        };
    },
});

export const searchMessages = query({
    args: {
        searchQuery: v.string(),
        sessionToken: v.string(),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, { searchQuery, sessionToken, paginationOpts }): Promise<PaginationResult<ThreadDoc & { relevantMessages?: MessageDoc[] }>> => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        const userId = sessionData.userId as Id<"user">;

        // If no search query, return empty results
        if (!searchQuery.trim()) {
            return {
                page: [],
                isDone: true,
                continueCursor: "",
            };
        }

        // Search messages using full-text search
        const searchResults = await ctx.runQuery(components.agent.messages.textSearch, {
            text: searchQuery.trim(),
            limit: 100, // Get more results for better thread matching
            searchAllMessagesForUserId: userId,
        });

        // Get unique thread IDs from search results
        const threadIds = [...new Set(searchResults.map((msg) => msg.threadId))];

        // Get thread details for each unique thread ID
        const threadsWithMessages: (ThreadDoc & { relevantMessages?: MessageDoc[] })[] = [];

        for (const threadId of threadIds) {
            try {
                const thread = await ctx.runQuery(components.agent.threads.getThread, { threadId });
                if (thread && thread.userId === userId) {
                    // Get relevant messages for this thread from search results
                    const relevantMessages = searchResults.filter((msg) => msg.threadId === threadId);
                    threadsWithMessages.push({
                        ...thread,
                        relevantMessages,
                    });
                }
            } catch (error) {
                // Skip threads that don't exist or can't be accessed
                continue;
            }
        }

        // Sort by relevance (threads with more matching messages first, then by creation time)
        threadsWithMessages.sort((a, b) => {
            const aRelevance = a.relevantMessages?.length || 0;
            const bRelevance = b.relevantMessages?.length || 0;

            if (aRelevance !== bRelevance) {
                return bRelevance - aRelevance; // More relevant first
            }

            return b._creationTime - a._creationTime; // Newer first for same relevance
        });

        // Apply pagination to the sorted results
        const startIndex = paginationOpts.cursor ? threadsWithMessages.findIndex((t) => t._id === paginationOpts.cursor) + 1 : 0;
        const endIndex = Math.min(startIndex + paginationOpts.numItems, threadsWithMessages.length);
        const paginatedThreads = threadsWithMessages.slice(startIndex, endIndex);

        return {
            page: paginatedThreads,
            isDone: endIndex >= threadsWithMessages.length,
            continueCursor: endIndex < threadsWithMessages.length ? threadsWithMessages[endIndex - 1]?._id || "" : "",
        };
    },
});

// Action for prompt improvement
export const improvePrompt = internalAction({
    args: {
        prompt: v.string(),
        sessionToken: v.string(),
        threadId: v.string(),
        improvementInstructions: v.optional(v.string()),
    },
    handler: async (ctx, { prompt, sessionToken, threadId, improvementInstructions }) => {
        // Verify session
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken,
        });

        const isAuthenticated = !!sessionData;
        const userId = sessionData?.userId;

        if (!prompt.trim()) {
            throw new ConvexError("Prompt cannot be empty");
        }

        // Check rate limits
        const rateLimitName = getRateLimitName("promptImprovement", isAuthenticated);
        const rateLimitResult = await checkRateLimit(ctx, rateLimitName, {
            key: userId || "anonymous",
            count: 1,
        });

        if (!rateLimitResult.ok) {
            const retryAfterSeconds = Math.ceil((rateLimitResult.retryAfter || 60000) / 1000);
            throw new ConvexError({
                kind: "RateLimitError",
                message: `Rate limit exceeded. Please try again in ${retryAfterSeconds} seconds.`,
                retryAfter: rateLimitResult.retryAfter,
                name: rateLimitName,
            });
        }

        // Check global rate limit as well
        const globalRateLimitResult = await checkRateLimit(ctx, "globalPromptImprovement", {
            key: "global",
            count: 1,
        });

        if (!globalRateLimitResult.ok) {
            throw new ConvexError({
                kind: "RateLimitError",
                message: "System is currently busy. Please try again in a moment.",
                retryAfter: globalRateLimitResult.retryAfter,
                name: "globalPromptImprovement",
            });
        }

        const agent = getAgent("gemini-1.5-flash");

        const { thread } = await agent.continueThread(ctx, { threadId });

        // Build the system prompt with optional improvement instructions
        let systemPrompt = `You are an expert prompt engineer. Your task is to improve user prompts to make them more effective, clear, and likely to produce better AI responses.

Guidelines for improvement:
1. Make the prompt more specific and detailed
2. Add context where helpful
3. Structure the request clearly
4. Include examples if beneficial
5. Specify the desired format or style of response
6. Remove ambiguity and add clarity
7. Keep the core intent intact while enhancing effectiveness

Return the improved prompt in the improvedPrompt field. The improved prompt should be ready to use directly without any explanation or meta-commentary.

Original prompt to improve: "${prompt.trim()}"`;

        // Add specific improvement instructions if provided
        if (improvementInstructions?.trim()) {
            systemPrompt += `\n\nSpecific improvement instructions: ${improvementInstructions.trim()}`;
        }

        const result = await thread.generateObject(
            {
                prompt: systemPrompt,
                schema: z.object({ improvedPrompt: z.string() }),
            },
            {
                storageOptions: {
                    saveMessages: "none",
                },
            },
        );

        const jsonResponse = result.toJsonResponse();
        return await jsonResponse.json();
    },
});

// HTTP action for prompt improvement (wrapper around the action)
export const improvePromptHttpAction = httpAction(async (ctx, request) => {
    // Parse the request body
    const body = await request.json();
    const { prompt, sessionToken, threadId, improvementInstructions } = body;

    if (!prompt || !sessionToken) {
        return new Response(JSON.stringify({ error: "Missing prompt or sessionToken" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const result = await ctx.runAction(internal.chat.functions.improvePrompt, {
            prompt,
            sessionToken,
            threadId,
            improvementInstructions,
        });

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error improving prompt:", error);

        const errorMessage = error instanceof ConvexError ? error.message : "Failed to improve prompt";

        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});

export const getFullThreadForExport = query({
    args: {
        threadId: v.string(),
        sessionToken: v.string(),
        model: v.string(),
    },
    async handler(ctx, { threadId, sessionToken, model }) {
        const sessionData: any | null = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        const thread = await ctx.runQuery(components.agent.threads.getThread, { threadId });
        if (!thread) {
            throw new Error("Thread not found");
        }

        if (thread.userId !== sessionData.userId) {
            throw new ConvexError("Unauthorized access to thread");
        }

        const agent = getAgent(model as AgentModel);

        // This logic is copied from listMessages to handle branches correctly.
        const threadRelationship = await ctx.runQuery(internal.chat.functions.getThreadRelationship, {
            threadId,
        });

        let allMessages: MessageDoc[] = [];

        if (threadRelationship) {
            // Get parent messages up to the branch point
            const parentMessages = await agent.listMessages(ctx, {
                threadId: threadRelationship.parentThreadId,
                paginationOpts: { numItems: 10000, cursor: null }, // Fetch all
            });

            // Get current thread messages
            const currentMessages = await agent.listMessages(ctx, {
                threadId,
                paginationOpts: { numItems: 10000, cursor: null }, // Fetch all
            });

            // Take only parent messages up to the branch point (inclusive)
            const parentMessagesUpToBranch = parentMessages.page.slice(0, (threadRelationship.branchPoint || 0) + 1);

            // Merge parent messages with current thread messages
            allMessages = [...parentMessagesUpToBranch, ...currentMessages.page];
        } else {
            const messages = await agent.listMessages(ctx, {
                threadId,
                paginationOpts: { numItems: 10000, cursor: null }, // Fetch all
            });
            allMessages = messages.page;
        }

        return { thread, messages: allMessages };
    },
});
