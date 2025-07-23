import type { MessageDoc, ThreadDoc } from "@convex-dev/agent";
import type { PaginationResult } from "convex/server";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import z from "zod/v4";

import { components, internal } from "../_generated/api";
import type { Doc as Document_ } from "../_generated/dataModel";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import type { AgentModel } from "../ai/lib/agents";
import { getAgent } from "../ai/lib/agents";
import createCacheMiddleware from "../ai/middlewares/cacheMiddleware";
import { authedAction, authedMutation, authedQuery } from "../auth/functions";
import { checkRateLimit, getRateLimitName } from "../lib/rateLimiter";
import threadTitlePrompt from "./prompts/thread-title-prompt.txt";

export const createThread = authedMutation({
    args: {
        model: v.string(),
        title: v.string(),
    },
    handler: async (context, { model, title }) => {
        const { userId } = context.user;

        const agent = getAgent(model as AgentModel);

        const { threadId }: { threadId: string } = await agent.createThread(context, {
            agentName: "chat",
            title,
            userId,
        });

        // Insert into threads table if not already present
        const existing = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();

        if (!existing) {
            await context.db.insert("threads", {
                createdBy: userId,
                model,
                tags: ["chat"],
                threadId,
                updatedAt: Date.now(),
                userId,
            });
        }

        return threadId;
    },
    returns: v.string(),
});

export const getThreadMessages = authedQuery({
    args: {
        model: v.string(),
        paginationOpts: paginationOptsValidator,
        threadId: v.string(),
    },
    handler: async (context, { model, paginationOpts, threadId }): Promise<PaginationResult<MessageDoc>> => {
        const { userId } = context.user;

        // Check if user has access to this thread
        const hasAccess = await context.runQuery(internal.chat.sharing.checkThreadAccess, {
            requiredPermission: "read",
            threadId,
            userId,
        });

        if (!hasAccess) {
            throw new ConvexError("Access denied to this thread");
        }

        const agent = getAgent(model as AgentModel);

        // Check if this thread has a parent (is a branch)
        const threadRelationship = await context.runQuery(internal.chat.functions.getThreadRelationship, {
            threadId,
        });

        if (threadRelationship) {
            // Get parent messages up to the branch point
            const parentMessages = await agent.listMessages(context, {
                paginationOpts: { cursor: null, numItems: 1000 },
                threadId: threadRelationship.parentThreadId,
            });

            // Get current thread messages
            const currentMessages = await agent.listMessages(context, {
                paginationOpts: { cursor: null, numItems: 1000 },
                threadId,
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
                continueCursor: endIndex < mergedMessages.length ? mergedMessages[endIndex - 1]?._id ?? "" : "",
                isDone: endIndex >= mergedMessages.length,
                page: paginatedMessages,
            };
        }

        // If no parent, return current messages with original pagination
        const paginated = await agent.listMessages(context, {
            paginationOpts,
            threadId,
        });

        return paginated;
    },
});

export const continueThread = authedAction({
    args: { model: v.string(), prompt: v.string(), threadId: v.string() },
    handler: async (context, { model, prompt, threadId }) => {
        const { userId } = context.user;

        // Check if user has write access to this thread
        const hasAccess = await context.runQuery(internal.chat.sharing.checkThreadAccess, {
            requiredPermission: "write",
            threadId,
            userId,
        });

        if (!hasAccess) {
            throw new ConvexError("Write access denied to this thread");
        }

        const agent = getAgent(model as AgentModel);

        const { thread } = await agent.continueThread(context, {
            threadId,
            userId,
        });

        const result = await thread.streamText({ prompt });

        return result.toDataStreamResponse();
    },
});

export const getThreads = authedQuery({
    args: { paginationOpts: paginationOptsValidator },
    handler: async (context, { paginationOpts }): Promise<PaginationResult<ThreadDoc>> => {
        const { userId } = context.user;
        const results = await context.runQuery(components.agent.threads.listThreadsByUserId, { paginationOpts, userId });

        const appThreads = await context.db
            .query("threads")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        // Create a map for quick lookup of app thread data
        const appThreadsMap = new Map(appThreads.map((thread) => [thread.threadId, thread]));

        return {
            ...results,
            page: results.page
                .filter((t) => !appThreads.some((appThread) => appThread.threadId === t._id && appThread.deleted))
                .map((t) => {
                    const appThread = appThreadsMap.get(t._id);

                    return {
                        ...t,
                        tags: appThread?.tags || ["chat"], // Include tags information
                    };
                }),
        };
    },
});

export const getThread = authedQuery({
    args: {
        threadId: v.string(),
    },
    handler: async (context, { threadId }) =>
        await context.runQuery(components.agent.threads.getThread, {
            threadId,
        }),
});

export const updateThread = authedAction({
    args: {
        model: v.string(),
        order: v.optional(v.number()),
        status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
        summary: v.optional(v.string()),
        threadId: v.string(),
        title: v.optional(v.string()),
    },
    handler: async (context, { model, order, status, summary, threadId, title }) => {
        const { userId } = context.user;

        // Check if user has admin access to this thread
        const hasAccess = await context.runQuery(internal.chat.sharing.checkThreadAccess, {
            requiredPermission: "admin",
            threadId,
            userId,
        });

        if (!hasAccess) {
            throw new ConvexError("Admin access denied to this thread");
        }

        const agent = getAgent(model as AgentModel);

        const { thread } = await agent.continueThread(context, {
            threadId,
            userId,
        });

        await thread.updateMetadata({ status, summary, title });

        return thread.threadId;
    },
});

export const createTitleChat = internalAction({
    args: { prompt: v.string(), threadId: v.string() },
    handler: async (context, arguments_) => {
        const model = "gemini-2.5-flash";

        const agent = getAgent(model, {
            middleware: [createCacheMiddleware(`${model}-title-chat`, context)],
        });

        const { thread } = await agent.continueThread(context, {
            threadId: arguments_.threadId,
        });

        const metaData = await thread.getMetadata();

        if (!metaData.title) {
            return;
        }

        const textResult = await thread.generateText(
            {
                prompt: `${threadTitlePrompt}\nHere is the user's prompt:\n"${arguments_.prompt}"\nGenerate a title that accurately represents what this conversation is about based on the prompt provided.`,
            },
            {
                storageOptions: {
                    saveMessages: "none",
                },
            },
        );

        await thread.updateMetadata({
            title: textResult.text,
        });
    },
});

export const createSummarizeChat = internalAction({
    args: { threadId: v.string(), userId: v.string() },
    handler: async (context, arguments_) => {
        const model = "gemini-2.5-flash";

        const agent = getAgent(model, {
            middleware: [createCacheMiddleware(`${model}-summarize-chat`, context)],
        });

        const { thread } = await agent.continueThread(context, {
            threadId: arguments_.threadId,
        });

        const messageDocs = await agent.fetchContextMessages(context, {
            contextOptions: {},
            messages: [],
            threadId: thread.threadId,
            userId: arguments_.userId,
        });

        const textResult = await thread.generateText(
            {
                prompt: `Summarize the key points of the following conversation in a single, concise sentence. Conversation: ${JSON.stringify(
                    messageDocs.map((message) => message.message),
                )}`,
            },
            {
                storageOptions: {
                    saveMessages: "none",
                },
            },
        );

        await thread.updateMetadata({ summary: textResult.text });
    },
});

export const createThreadRelationship = internalMutation({
    args: {
        branchPoint: v.optional(v.number()),
        branchType: v.optional(v.union(v.literal("branch"), v.literal("continuation"))),
        parentThreadId: v.string(),
        threadId: v.string(),
    },
    handler: async (context, arguments_) => {
        await context.db.insert("threadRelationships", {
            branchPoint: arguments_.branchPoint || 0,
            branchType: arguments_.branchType || "branch",
            createdAt: Date.now(),
            parentThreadId: arguments_.parentThreadId,
            threadId: arguments_.threadId,
        });
    },
});

export const getThreadRelationship = internalQuery({
    args: {
        threadId: v.string(),
    },
    handler: async (context, arguments_) => {
        const relationship = await context.db
            .query("threadRelationships")
            .withIndex("by_thread", (q) => q.eq("threadId", arguments_.threadId))
            .unique();

        return relationship;
    },
});

export const getChildThreads = authedQuery({
    args: {
        parentThreadId: v.string(),
    },
    handler: async (context, arguments_) => {
        // Get all child threads for this parent
        const relationships = await context.db
            .query("threadRelationships")
            .withIndex("by_parent", (q) => q.eq("parentThreadId", arguments_.parentThreadId))
            .collect();

        // Get the actual thread data for each child
        const childThreads = [];

        for await (const relationship of relationships) {
            const thread = await context.runQuery(components.agent.threads.getThread, {
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
    handler: async (context, arguments_) => {
        const relationship = await context.db
            .query("threadRelationships")
            .withIndex("by_thread", (q) => q.eq("threadId", arguments_.threadId))
            .unique();

        if (relationship) {
            await context.db.delete(relationship._id);
        }
    },
});

export const deleteAppThread = internalMutation({
    args: {
        threadId: v.string(),
    },
    handler: async (context, { threadId }) => {
        const threads = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();

        if (threads) {
            await context.db.delete(threads._id);
        }
    },
});

// Update deleteThread to also clean up relationships and threads options
export const deleteThread = authedMutation({
    args: { threadId: v.string() },
    handler: async (context, { threadId }) => {
        await context.runMutation(internal.chat.functions.deleteAppThread, {
            threadId,
        });

        await context.runMutation(internal.chat.functions.deleteThreadRelationship, {
            threadId,
        });

        // Delete the actual thread
        return await context.runMutation(components.agent.threads.deleteAllForThreadIdAsync, { threadId });
    },
});

export const getAllThreadRelationships = authedQuery({
    args: {},
    handler: async (context) => {
        // Get all thread relationships for building the hierarchy
        const relationships = await context.db.query("threadRelationships").collect();

        return relationships;
    },
});

export const validateThreadExists = authedQuery({
    args: {
        threadId: v.string(),
    },
    handler: async (context, arguments_) => {
        try {
            // Check if the thread exists using the agent API
            const thread = await context.runQuery(components.agent.threads.getThread, {
                threadId: arguments_.threadId,
            });

            return thread !== null;
        } catch {
            // If thread doesn't exist or any error occurs, return false
            return false;
        }
    },
});

export const pinThread = authedMutation({
    args: {
        threadId: v.string(),
    },
    handler: async (context, { threadId }) => {
        const { userId } = context.user;
        // Find the user's thread record
        const thread = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();

        if (!thread) {
            throw new ConvexError("Thread not found");
        }

        if (thread.userId && thread.userId !== userId) {
            throw new ConvexError("Cannot pin thread for another user");
        }

        // Pin the thread for this user
        await context.db.patch(thread._id, {
            pinnedAt: Date.now(),
            userId,
        });

        return { success: true };
    },
});

export const unpinThread = authedMutation({
    args: {
        threadId: v.string(),
    },
    handler: async (context, { threadId }) => {
        const { userId } = context.user;
        const thread = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();

        if (!thread)
            throw new ConvexError("Thread not found");

        if (thread.userId !== userId) {
            throw new ConvexError("Thread is not pinned by this user");
        }

        await context.db.patch(thread._id, {
            pinnedAt: undefined,
        });

        return { success: true };
    },
});

export const getPinnedThreads = authedQuery({
    args: {},
    handler: async (context) => {
        const { userId } = context.user;
        const pinnedThreads = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q)
            .collect();

        // Filter for threads pinned by this user and not deleted
        return pinnedThreads.filter((thread) => thread.userId === userId && thread.pinnedAt && !thread.deleted);
    },
    returns: v.array(v.any()),
});

export const updateThreadOrder = authedMutation({
    args: {
        threadOrders: v.array(
            v.object({
                order: v.number(),
                threadId: v.string(),
            }),
        ),
    },
    handler: async (context, { threadOrders }) => {
        const { userId } = context.user;

        for (const { order, threadId } of threadOrders) {
            const thread = await context.db
                .query("threads")
                .withIndex("by_thread", (q) => q.eq("threadId", threadId))
                .unique();

            if (thread && thread.userId === userId) {
                await context.db.patch(thread._id, {
                    order,
                    updatedAt: Date.now(),
                });
            }
        }

        return { success: true };
    },
});

export const getThreadOrders = authedQuery({
    args: {},
    handler: async (context) => {
        const { userId } = context.user;
        const threads = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q)
            .collect();

        return threads.filter((thread) => thread.userId === userId && thread.order !== undefined && !thread.deleted);
    },
    returns: v.array(v.any()),
});

export const updateThreadVisibility = authedMutation({
    args: {
        isPublic: v.optional(v.boolean()),
        publicAccessToken: v.optional(v.string()),
        threadId: v.string(),
    },
    handler: async (context, { isPublic, publicAccessToken, threadId }) => {
        const { userId } = context.user;
        const thread = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();

        if (!thread) {
            throw new ConvexError("Thread not found");
        }

        if (thread.userId !== userId) {
            throw new ConvexError("Cannot update visibility for another user's thread");
        }

        await context.db.patch(thread._id, {
            isPublic,
            publicAccessToken,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

export const searchThreads = authedQuery({
    args: {
        paginationOpts: paginationOptsValidator,

        searchQuery: v.string(),
    },
    handler: async (context, { paginationOpts, searchQuery }): Promise<PaginationResult<ThreadDoc>> => {
        const identity = await context.auth.getUserIdentity();

        if (!identity) {
            throw new ConvexError("User must be logged in.");
        }

        const userId = identity.subject;

        // Get all threads for the user
        const allThreads = await context.runQuery(components.agent.threads.listThreadsByUserId, {
            paginationOpts: { cursor: null, numItems: 1000 }, // Get all threads for filtering
            userId,
        });

        // If no search query, return regular threads with pagination
        if (!searchQuery.trim()) {
            return await context.runQuery(components.agent.threads.listThreadsByUserId, {
                paginationOpts,
                userId,
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
            if (aTitleMatch && !bTitleMatch) {
                return -1;
            }

            if (!aTitleMatch && bTitleMatch) {
                return 1;
            }

            // Then by creation time (newest first)
            return b._creationTime - a._creationTime;
        });

        // Apply pagination to filtered results
        const startIndex = paginationOpts.cursor ? filteredThreads.findIndex((t) => t._id === paginationOpts.cursor) + 1 : 0;
        const endIndex = Math.min(startIndex + paginationOpts.numItems, filteredThreads.length);
        const paginatedThreads = filteredThreads.slice(startIndex, endIndex);

        return {
            continueCursor: filteredThreads[endIndex - 1]._id,
            isDone: endIndex >= filteredThreads.length,
            page: paginatedThreads,
        };
    },
});

export const searchMessages = authedQuery({
    args: {
        paginationOpts: paginationOptsValidator,

        searchQuery: v.string(),
    },
    handler: async (context, { paginationOpts, searchQuery }): Promise<PaginationResult<ThreadDoc & { relevantMessages?: MessageDoc[] }>> => {
        const { userId } = context.user;

        // If no search query, return empty results
        if (!searchQuery.trim()) {
            return {
                continueCursor: "",
                isDone: true,
                page: [],
            };
        }

        // Search messages using full-text search
        const searchResults = await context.runQuery(components.agent.messages.textSearch, {
            limit: 100, // Get more results for better thread matching
            searchAllMessagesForUserId: userId,
            text: searchQuery.trim(),
        });

        // Get unique thread IDs from search results
        const threadIds = [...new Set(searchResults.map((message) => message.threadId))];

        // Get thread details for each unique thread ID
        const threadsWithMessages: (ThreadDoc & {
            relevantMessages?: MessageDoc[];
        })[] = [];

        for (const threadId of threadIds) {
            try {
                const thread = await context.runQuery(components.agent.threads.getThread, { threadId });

                if (thread && thread.userId === userId) {
                    // Get relevant messages for this thread from search results
                    const relevantMessages = searchResults.filter((message) => message.threadId === threadId);

                    threadsWithMessages.push({
                        ...thread,
                        relevantMessages,
                    });
                }
            } catch {
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
            continueCursor: endIndex < threadsWithMessages.length ? threadsWithMessages[endIndex - 1]?._id || "" : "",
            isDone: endIndex >= threadsWithMessages.length,
            page: paginatedThreads,
        };
    },
});

export const improvePrompt = internalAction({
    args: {
        improvementInstructions: v.optional(v.string()),
        prompt: v.string(),
        threadId: v.string(),
    },
    handler: async (context, { improvementInstructions, prompt, threadId }) => {
        const identity = await context.auth.getUserIdentity();

        if (!identity) {
            throw new ConvexError("User must be logged in.");
        }

        const userId = identity.subject;

        if (!prompt.trim()) {
            throw new ConvexError("Prompt cannot be empty");
        }

        // Check rate limits
        const rateLimitName = getRateLimitName("promptImprovement", true);
        const rateLimitResult = await checkRateLimit(context, rateLimitName, {
            count: 1,
            key: userId,
        });

        if (!rateLimitResult.ok) {
            const retryAfterSeconds = Math.ceil((rateLimitResult.retryAfter || 60_000) / 1000);

            throw new ConvexError({
                kind: "RateLimitError",
                message: `Rate limit exceeded. Please try again in ${retryAfterSeconds} seconds.`,
                name: rateLimitName,
                retryAfter: rateLimitResult.retryAfter,
            });
        }

        // Check global rate limit as well
        const globalRateLimitResult = await checkRateLimit(context, "globalPromptImprovement", {
            count: 1,
            key: "global",
        });

        if (!globalRateLimitResult.ok) {
            throw new ConvexError({
                kind: "RateLimitError",
                message: "System is currently busy. Please try again in a moment.",
                name: "globalPromptImprovement",
                retryAfter: globalRateLimitResult.retryAfter,
            });
        }

        const model = "gemini-2.5-flash";
        const agent = getAgent(model, {
            middleware: [createCacheMiddleware(`${model}-improve-prompt`, context)],
        });

        const { thread } = await agent.continueThread(context, { threadId });

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

        const { object: improvedPromptObject } = await thread.generateObject({
            prompt: systemPrompt,
            schema: z.object({ improvedPrompt: z.string() }).strict(),
            storageOptions: {
                saveMessages: "none",
            },
        });

        return improvedPromptObject;
    },
});

export const getFullThreadForExport = authedQuery({
    args: {
        model: v.string(),
        threadId: v.string(),
    },
    async handler(context, { model, threadId }) {
        const { userId } = context.user;

        const thread = await context.runQuery(components.agent.threads.getThread, { threadId });

        if (!thread) {
            throw new Error("Thread not found");
        }

        if (thread.userId !== userId) {
            throw new ConvexError("Unauthorized access to thread");
        }

        const agent = getAgent(model as AgentModel);

        // This logic is copied from listMessages to handle branches correctly.
        const threadRelationship = await context.runQuery(internal.chat.functions.getThreadRelationship, {
            threadId,
        });

        let allMessages: MessageDoc[] = [];

        if (threadRelationship) {
            // Get parent messages up to the branch point
            const parentMessages = await agent.listMessages(context, {
                paginationOpts: { cursor: null, numItems: 10_000 }, // Fetch all
                threadId: threadRelationship.parentThreadId,
            });

            // Get current thread messages
            const currentMessages = await agent.listMessages(context, {
                paginationOpts: { cursor: null, numItems: 10_000 }, // Fetch all
                threadId,
            });

            // Take only parent messages up to the branch point (inclusive)
            const parentMessagesUpToBranch = parentMessages.page.slice(0, (threadRelationship.branchPoint || 0) + 1);

            // Merge parent messages with current thread messages
            allMessages = [...parentMessagesUpToBranch, ...currentMessages.page];
        } else {
            const messages = await agent.listMessages(context, {
                paginationOpts: { cursor: null, numItems: 10_000 }, // Fetch all
                threadId,
            });

            allMessages = messages.page;
        }

        return { messages: allMessages, thread };
    },
});

export const branchThread = authedMutation({
    args: {
        branchName: v.optional(v.string()),
        branchPoint: v.optional(v.number()),
        threadId: v.string(), // parent thread
    },
    handler: async (context, { branchName, branchPoint, threadId }) => {
        const { userId } = context.user;

        // Get the parent thread to copy its model from the new threads table
        const parentThread = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();

        if (!parentThread) {
            throw new ConvexError("Parent thread not found");
        }

        const { model } = parentThread;

        if (!model) {
            throw new ConvexError("Parent thread is missing model");
        }

        const newThreadId: string = await context.runMutation(internal.chat.functions.createThread, {
            model,
            title: branchName || "",
        });

        const agent = getAgent(model as AgentModel);

        if (branchName) {
            const { thread } = await agent.continueThread(context, {
                threadId: newThreadId,
                userId,
            });

            await thread.updateMetadata({ title: branchName });
        }

        await context.runMutation(internal.chat.functions.createThreadRelationship, {
            branchPoint: branchPoint || 0,
            branchType: "branch",
            parentThreadId: threadId,
            threadId: newThreadId,
        });

        // Copy messages up to branchPoint (inclusive), or all if branchPoint is undefined
        const parentMessagesResult = await agent.listMessages(context, {
            paginationOpts: { cursor: null, numItems: 10_000 },
            threadId,
        });
        const parentMessages = parentMessagesResult.page;

        if (branchPoint !== undefined && branchPoint >= parentMessages.length) {
            await context.runMutation(internal.chat.functions.deleteThreadRelationship, {
                threadId: newThreadId,
            });
            await context.runMutation(components.agent.threads.deleteAllForThreadIdAsync, { threadId: newThreadId });

            throw new ConvexError("Branch point is greater than the parent messages length");
        }

        return newThreadId;
    },
    returns: v.string(),
});

export const softDeleteThread = authedMutation({
    args: { threadId: v.string() },
    handler: async (context, { threadId }) => {
        const { userId } = context.user;
        const thread = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();

        if (!thread || thread.userId !== userId) {
            throw new ConvexError("Not allowed");
        }

        await context.db.patch(thread._id, {
            deleted: true,
            deletedAt: Date.now(),
        });

        // Schedule hard delete in 24 hours (adjust as needed)
        await context.scheduler.runAfter(24 * 60 * 60 * 1000, internal.chat.functions.hardDeleteThread, { threadId });
    },
});

export const hardDeleteThread = internalMutation({
    args: { threadId: v.string() },
    handler: async (context, { threadId }) => {
        const thread = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();

        if (thread) {
            await context.db.delete(thread._id);
        }
    },
});

export const undoDeleteThread = authedMutation({
    args: { threadId: v.string() },
    handler: async (context, { threadId }) => {
        const { userId } = context.user;

        const thread = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();

        if (!thread || thread.userId !== userId) {
            throw new ConvexError("Not allowed");
        }

        await context.db.patch(thread._id, {
            deleted: false,
            deletedAt: undefined,
        });
    },
});

export const getUserTags = authedQuery({
    args: {},
    handler: async (context): Promise<Document_<"threadTags">[]> => {
        const userId = context.user._id;

        const tags = await context.db
            .query("threadTags")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        return tags.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    },
});

export const createTag = authedMutation({
    args: {
        name: v.string(),
    },
    handler: async (context, { name }): Promise<string> => {
        const userId = context.user._id;

        // Check if tag already exists for this user
        const existing = await context.db
            .query("threadTags")
            .withIndex("by_user_and_name", (q) => q.eq("userId", userId).eq("name", name))
            .unique();

        if (existing) {
            return existing._id;
        }

        const tagId = await context.db.insert("threadTags", {
            createdAt: Date.now(),
            name,
            usageCount: 0,
            userId,
        });

        return tagId;
    },
});

export const updateThreadTags = authedMutation({
    args: {
        tags: v.array(v.string()),
        threadId: v.string(),
    },
    handler: async (context, { tags, threadId }): Promise<void> => {
        const userId = context.user._id;

        // Find the thread
        const thread = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();

        if (!thread) {
            throw new ConvexError("Thread not found");
        }

        // Check if user owns the thread
        if (thread.userId !== userId) {
            throw new ConvexError("Not allowed");
        }

        const oldTags = thread.tags || ["chat"];
        const newTags = tags.length > 0 ? tags : ["chat"];

        // Update the thread tags
        await context.db.patch(thread._id, {
            tags: newTags,
            updatedAt: Date.now(),
        });

        // Update tag usage counts
        // Increment counts for new tags
        for (const tag of newTags) {
            if (tag !== "chat") {
                const existingTag = await context.db
                    .query("threadTags")
                    .withIndex("by_user_and_name", (q) => q.eq("userId", userId).eq("name", tag))
                    .unique();

                if (existingTag) {
                    await context.db.patch(existingTag._id, {
                        usageCount: (existingTag.usageCount || 0) + 1,
                    });
                } else {
                    await context.db.insert("threadTags", {
                        createdAt: Date.now(),
                        name: tag,
                        usageCount: 1,
                        userId,
                    });
                }
            }
        }

        // Decrement counts for removed tags
        for (const oldTag of oldTags) {
            if (oldTag !== "chat" && !newTags.includes(oldTag)) {
                const oldTagDocument = await context.db
                    .query("threadTags")
                    .withIndex("by_user_and_name", (q) => q.eq("userId", userId).eq("name", oldTag))
                    .unique();

                if (oldTagDocument && (oldTagDocument.usageCount || 0) > 0) {
                    await context.db.patch(oldTagDocument._id, {
                        usageCount: (oldTagDocument.usageCount || 0) - 1,
                    });
                }
            }
        }
    },
});

export const addThreadTag = authedMutation({
    args: {
        tag: v.string(),
        threadId: v.string(),
    },
    handler: async (context, { tag, threadId }): Promise<void> => {
        const userId = context.user._id;

        // Find the thread
        const thread = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();

        if (!thread) {
            throw new ConvexError("Thread not found");
        }

        // Check if user owns the thread
        if (thread.userId !== userId) {
            throw new ConvexError("Not allowed");
        }

        const currentTags = thread.tags || ["chat"];

        // Don't add if tag already exists
        if (currentTags.includes(tag)) {
            return;
        }

        const newTags = [...currentTags, tag];

        // Update the thread tags
        await context.db.patch(thread._id, {
            tags: newTags,
            updatedAt: Date.now(),
        });

        // Update tag usage count
        if (tag !== "chat") {
            const existingTag = await context.db
                .query("threadTags")
                .withIndex("by_user_and_name", (q) => q.eq("userId", userId).eq("name", tag))
                .unique();

            if (existingTag) {
                await context.db.patch(existingTag._id, {
                    usageCount: (existingTag.usageCount || 0) + 1,
                });
            } else {
                await context.db.insert("threadTags", {
                    createdAt: Date.now(),
                    name: tag,
                    usageCount: 1,
                    userId,
                });
            }
        }
    },
});

export const removeThreadTag = authedMutation({
    args: {
        tag: v.string(),
        threadId: v.string(),
    },
    handler: async (context, { tag, threadId }): Promise<void> => {
        const userId = context.user._id;

        // Find the thread
        const thread = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();

        if (!thread) {
            throw new ConvexError("Thread not found");
        }

        // Check if user owns the thread
        if (thread.userId !== userId) {
            throw new ConvexError("Not allowed");
        }

        const currentTags = thread.tags || ["chat"];
        const newTags = currentTags.filter((t) => t !== tag);

        // Ensure at least one tag remains (default to "chat")
        if (newTags.length === 0) {
            newTags.push("chat");
        }

        // Update the thread tags
        await context.db.patch(thread._id, {
            tags: newTags,
            updatedAt: Date.now(),
        });

        // Decrement tag usage count
        if (tag !== "chat") {
            const tagDocument = await context.db
                .query("threadTags")
                .withIndex("by_user_and_name", (q) => q.eq("userId", userId).eq("name", tag))
                .unique();

            if (tagDocument && (tagDocument.usageCount || 0) > 0) {
                await context.db.patch(tagDocument._id, {
                    usageCount: (tagDocument.usageCount || 0) - 1,
                });
            }
        }
    },
});

export const getThreadsByTag = authedQuery({
    args: {
        paginationOpts: paginationOptsValidator,
        tag: v.optional(v.string()),
    },
    handler: async (context, { paginationOpts, tag }): Promise<PaginationResult<ThreadDoc>> => {
        const userId = context.user._id;

        // Get threads from agent component
        const results = await context.runQuery(components.agent.threads.listThreadsByUserId, { paginationOpts, userId });

        // Get all app threads (we'll filter in memory since we can't easily query array contains in Convex)
        const appThreads = await context.db
            .query("threads")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        // Create a map for quick lookup of app thread data
        const appThreadsMap = new Map(appThreads.map((thread) => [thread.threadId, thread]));

        // Filter results based on tag
        const filteredResults = results.page
            .filter((t) => {
                const appThread = appThreads.find((appThread) => appThread.threadId === t._id);

                // Skip deleted threads
                if (appThread && appThread.deleted) {
                    return false;
                }

                // If no tag filter, show all threads
                if (!tag) {
                    return true;
                }

                // If thread has app data, check if it has the tag
                if (appThread) {
                    const threadTags = appThread.tags || ["chat"];

                    return threadTags.includes(tag);
                }

                // If no app data and looking for "chat" tag, include it (default)
                return tag === "chat";
            })
            .map((t) => {
                const appThread = appThreadsMap.get(t._id);

                return {
                    ...t,
                    tags: appThread?.tags || ["chat"], // Include tags information
                };
            });

        return {
            ...results,
            page: filteredResults,
        };
    },
});
