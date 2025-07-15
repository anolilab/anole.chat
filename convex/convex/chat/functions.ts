import type { MessageDoc, ThreadDoc } from "@convex-dev/agent";
import { getFile } from "@convex-dev/agent";
import type { PaginationResult } from "convex/server";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import z from "zod";

import { components, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx as ActionContext } from "../_generated/server";
import {
    internalAction,
    internalMutation,
    internalQuery,
} from "../_generated/server";
import type { AgentModel } from "../ai/lib/agents";
import { getAgent } from "../ai/lib/agents";
import createCacheMiddleware from "../ai/middlewares/cacheMiddleware";
import { authedAction, authedMutation, authedQuery } from "../auth/functions";
import { checkRateLimit, getRateLimitName } from "../lib/rateLimiter";
import threadTitlePrompt from "./prompts/thread-title-prompt.txt";

export const createThread = authedMutation({
    args: {
        branchName: v.optional(v.string()),
        branchPoint: v.optional(v.number()),
        model: v.string(),
        parentThreadId: v.optional(v.string()),
    },
    handler: async (context, arguments_) => {
        const userId = context.user._id;

        const agent = getAgent(arguments_.model as AgentModel);

        // Create the thread using the standard agent API
        const createOptions = {
            agentName: "chat",
            title: arguments_.branchName || undefined,
            userId,
        };

        const { threadId }: { threadId: string } = await agent.createThread(
            context,
            createOptions,
        );

        // TODO: Fix upstream - @convex-dev/agent createThread doesn't support parentThreadIds
        // The agent's createThread function signature doesn't include parentThreadIds parameter
        // Once this is added upstream, we can pass parentThreadIds directly in createOptions above
        // Create thread relationship if this is a branch
        if (arguments_.parentThreadId) {
            await context.runMutation(
                internal.chat.functions.createThreadRelationship,
                {
                    branchPoint: arguments_.branchPoint || 0,
                    branchType: "branch",
                    parentThreadId: arguments_.parentThreadId,
                    threadId,
                },
            );
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
    handler: async (
        context,
        { model, paginationOpts, threadId },
    ): Promise<PaginationResult<MessageDoc>> => {
        const userId = context.user._id;

        // Check if user has access to this thread
        const hasAccess = await context.runQuery(
            internal.chat.sharing.checkThreadAccess,
            {
                requiredPermission: "read",
                threadId,
                userId,
            },
        );

        if (!hasAccess) {
            throw new ConvexError("Access denied to this thread");
        }

        const agent = getAgent(model as AgentModel);

        // Check if this thread has a parent (is a branch)
        const threadRelationship = await context.runQuery(
            internal.chat.functions.getThreadRelationship,
            {
                threadId,
            },
        );

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
            const parentMessagesUpToBranch = parentMessages.page.slice(
                0,
                (threadRelationship.branchPoint || 0) + 1,
            );

            // Merge parent messages with current thread messages
            const mergedMessages = [
                ...parentMessagesUpToBranch,
                ...currentMessages.page,
            ];

            // Apply pagination to the merged result
            const startIndex = paginationOpts.cursor
                ? mergedMessages.findIndex(
                    (m) => m._id === paginationOpts.cursor,
                ) + 1
                : 0;
            const endIndex = Math.min(
                startIndex + paginationOpts.numItems,
                mergedMessages.length,
            );
            const paginatedMessages = mergedMessages.slice(
                startIndex,
                endIndex,
            );

            return {
                continueCursor:
                    endIndex < mergedMessages.length
                        ? mergedMessages[endIndex - 1]?._id ?? ""
                        : "",
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
        const userId = context.user._id;

        // Check if user has write access to this thread
        const hasAccess = await context.runQuery(
            internal.chat.sharing.checkThreadAccess,
            {
                requiredPermission: "write",
                threadId,
                userId,
            },
        );

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
    handler: async (
        context,
        { paginationOpts },
    ): Promise<PaginationResult<ThreadDoc>> => {
        const userId = context.user._id;
        const results = await context.runQuery(
            components.agent.threads.listThreadsByUserId,
            { paginationOpts, userId },
        );

        return results;
    },
});

export const getThread = authedQuery({
    args: {
        threadId: v.string(),
    },
    handler: async (context, { threadId }) => {
        return await context.runQuery(components.agent.threads.getThread, { threadId });
    },
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
    handler: async (
        context,
        { model, order, status, summary, threadId, title },
    ) => {
        const userId = context.user._id;

        // Check if user has admin access to this thread
        const hasAccess = await context.runQuery(
            internal.chat.sharing.checkThreadAccess,
            {
                requiredPermission: "admin",
                threadId,
                userId,
            },
        );

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

export const streamHttpAction = async (
    context: ActionContext,
    request: Request,
) => {
    const { fileIds, model, prompt, threadId } = (await request.json()) as {
        fileIds?: string[];
        model: string;
        prompt?: string;
        threadId?: string;
    };

    const user = await context.runQuery(internal.auth.functions.getCurrentUser);
    const userId = user._id;

    const agent = getAgent(model as AgentModel);

    const { thread } = threadId
        ? await agent.continueThread(context, { threadId, userId })
        : await agent.createThread(context, { userId });

    // Create message content with file support
    const messageContent: any[] = [];

    if (fileIds) {
        try {
            for (const fileId of fileIds) {
                // @ts-ignore - Ignoring TypeScript errors for getFile function
                const { filePart, imagePart } = await getFile(
                    context,
                    components.agent,
                    fileId,
                );

                // Add file content to message (image takes precedence over file)
                if (imagePart && Object.keys(imagePart).length > 0) {
                    messageContent.push(imagePart);
                } else if (filePart && Object.keys(filePart).length > 0) {
                    messageContent.push(filePart);
                }
            }
        } catch (error) {
            console.error("Error processing file:", error);
            // TODO: Show a message to the user that the file is not supported
            // Continue without file if there's an error
        }
    }

    // Always ensure we have text content (never empty)
    const textContent = prompt?.trim() || "Please analyze the uploaded file.";

    messageContent.push({ text: textContent, type: "text" });

    const { messageId } = await agent.saveMessage(context, {
        message: {
            content: messageContent,
            role: "user",
        },
        // This will track the usage of the file, so we can delete old ones
        metadata: fileIds && fileIds.length > 0 ? { fileIds } : undefined,
        threadId: thread.threadId,
    });

    await context.scheduler.runAfter(
        0,
        internal.chat.functions.createTitleChat,
        {
            prompt: prompt ?? " ", // TODO: add prompt based on image
            threadId: thread.threadId,
        },
    );

    await context.scheduler.runAfter(
        0,
        internal.chat.functions.createSummarizeChat,
        {
            threadId: thread.threadId,
            userId,
        },
    );

    const result = await thread.streamText({ promptMessageId: messageId });

    return result.toDataStreamResponse({
        sendReasoning: true,
        sendSources: true,
        sendUsage: true,
    });
};

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
            middleware: [
                createCacheMiddleware(`${model}-summarize-chat`, context),
            ],
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
        branchType: v.optional(
            v.union(v.literal("branch"), v.literal("continuation")),
        ),
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
            .withIndex("by_thread", (q) =>
                q.eq("threadId", arguments_.threadId))
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
            .withIndex("by_parent", (q) =>
                q.eq("parentThreadId", arguments_.parentThreadId))
            .collect();

        // Get the actual thread data for each child
        const childThreads = [];

        for await (const relationship of relationships) {
            const thread = await context.runQuery(
                components.agent.threads.getThread,
                {
                    threadId: relationship.threadId,
                },
            );

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
            .withIndex("by_thread", (q) =>
                q.eq("threadId", arguments_.threadId))
            .unique();

        if (relationship) {
            await context.db.delete(relationship._id);
        }
    },
});

// Update deleteThread to also clean up relationships
export const deleteThreadWithRelationships = authedMutation({
    args: { threadId: v.string() },
    handler: async (context, { threadId }) => {
        // Delete the thread relationship
        await context.runMutation(
            internal.chat.functions.deleteThreadRelationship,
            {
                threadId,
            },
        );

        // Delete the actual thread
        return await context.runMutation(
            components.agent.threads.deleteAllForThreadIdAsync,
            { threadId },
        );
    },
});

export const getAllThreadRelationships = authedQuery({
    args: {},
    handler: async (context) => {
        // Get all thread relationships for building the hierarchy
        const relationships = await context.db
            .query("threadRelationships")
            .collect();

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
            const thread = await context.runQuery(
                components.agent.threads.getThread,
                {
                    threadId: arguments_.threadId,
                },
            );

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
    handler: async (context, arguments_) => {
        const userId = context.user._id;

        // Check if thread is already pinned
        const existingPin = await context.db
            .query("pinnedThreads")
            .withIndex("by_user_and_thread", (q) =>
                q
                    .eq("userId", userId as Id<"users">)
                    .eq("threadId", arguments_.threadId))
            .unique();

        if (existingPin) {
            throw new ConvexError("Thread is already pinned");
        }

        // Verify thread exists
        const threadExists = await context.runQuery(
            components.agent.threads.getThread,
            {
                threadId: arguments_.threadId,
            },
        );

        if (!threadExists) {
            throw new ConvexError("Thread not found");
        }

        // Pin the thread
        await context.db.insert("pinnedThreads", {
            pinnedAt: Date.now(),
            threadId: arguments_.threadId,
            userId,
        });

        return { success: true };
    },
});

export const unpinThread = authedMutation({
    args: {
        threadId: v.string(),
    },
    handler: async (context, arguments_) => {
        const userId = context.user._id;

        // Find the pinned thread record
        const pinnedThread = await context.db
            .query("pinnedThreads")
            .withIndex("by_user_and_thread", (q) =>
                q
                    .eq("userId", userId as Id<"users">)
                    .eq("threadId", arguments_.threadId))
            .unique();

        if (!pinnedThread) {
            throw new ConvexError("Thread is not pinned");
        }

        // Unpin the thread
        await context.db.delete(pinnedThread._id);

        return { success: true };
    },
});

export const getPinnedThreads = authedQuery({
    args: {},
    handler: async (context, arguments_) => {
        const userId = context.user._id;

        // Get all pinned threads for the user
        const pinnedThreads = await context.db
            .query("pinnedThreads")
            .withIndex("by_user", (q) => q.eq("userId", userId as Id<"users">))
            .collect();

        return pinnedThreads;
    },
    returns: v.array(v.any()),
});

export const isThreadPinned = authedQuery({
    args: {
        threadId: v.string(),
    },
    handler: async (context, arguments_) => {
        const userId = context.user._id;

        // Check if thread is pinned
        const pinnedThread = await context.db
            .query("pinnedThreads")
            .withIndex("by_user_and_thread", (q) =>
                q
                    .eq("userId", userId as Id<"users">)
                    .eq("threadId", arguments_.threadId))
            .unique();

        return pinnedThread !== null;
    },
    returns: v.boolean(),
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
    handler: async (context, arguments_) => {
        const userId = context.user._id;
        const now = Date.now();

        // Update or insert thread orders
        for (const { order, threadId } of arguments_.threadOrders) {
            // Check if order already exists
            const existingOrder = await context.db
                .query("threadOrders")
                .withIndex("by_user_and_thread", (q) =>
                    q
                        .eq("userId", userId as Id<"users">)
                        .eq("threadId", threadId))
                .unique();

            if (existingOrder) {
                // Update existing order
                await context.db.patch(existingOrder._id, {
                    order,
                    updatedAt: now,
                });
            } else {
                // Insert new order
                await context.db.insert("threadOrders", {
                    order,
                    threadId,
                    updatedAt: now,
                    userId: userId as Id<"users">,
                });
            }
        }

        return { success: true };
    },
});

export const getThreadOrders = authedQuery({
    args: {},
    handler: async (context, arguments_) => {
        const userId = context.user._id;

        // Get all thread orders for the user
        const threadOrders = await context.db
            .query("threadOrders")
            .withIndex("by_user", (q) => q.eq("userId", userId as Id<"users">))
            .collect();

        return threadOrders;
    },
    returns: v.array(v.any()),
});

export const searchThreads = authedQuery({
    args: {
        paginationOpts: paginationOptsValidator,

        searchQuery: v.string(),
    },
    handler: async (
        context,
        { paginationOpts, searchQuery },
    ): Promise<PaginationResult<ThreadDoc>> => {
        const identity = await context.auth.getUserIdentity();

        if (!identity) {
            throw new ConvexError("User must be logged in.");
        }

        const userId = identity.subject;

        // Get all threads for the user
        const allThreads = await context.runQuery(
            components.agent.threads.listThreadsByUserId,
            {
                paginationOpts: { cursor: null, numItems: 1000 }, // Get all threads for filtering
                userId,
            },
        );

        // If no search query, return regular threads with pagination
        if (!searchQuery.trim()) {
            return await context.runQuery(
                components.agent.threads.listThreadsByUserId,
                {
                    paginationOpts,
                    userId,
                },
            );
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
        const startIndex = paginationOpts.cursor
            ? filteredThreads.findIndex(
                (t) => t._id === paginationOpts.cursor,
            ) + 1
            : 0;
        const endIndex = Math.min(
            startIndex + paginationOpts.numItems,
            filteredThreads.length,
        );
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
    handler: async (
        context,
        { paginationOpts, searchQuery },
    ): Promise<
        PaginationResult<ThreadDoc & { relevantMessages?: MessageDoc[] }>
    > => {
        const userId = context.user._id;

        // If no search query, return empty results
        if (!searchQuery.trim()) {
            return {
                continueCursor: "",
                isDone: true,
                page: [],
            };
        }

        // Search messages using full-text search
        const searchResults = await context.runQuery(
            components.agent.messages.textSearch,
            {
                limit: 100, // Get more results for better thread matching
                searchAllMessagesForUserId: userId,
                text: searchQuery.trim(),
            },
        );

        // Get unique thread IDs from search results
        const threadIds = [
            ...new Set(searchResults.map((message) => message.threadId)),
        ];

        // Get thread details for each unique thread ID
        const threadsWithMessages: (ThreadDoc & {
            relevantMessages?: MessageDoc[];
        })[] = [];

        for (const threadId of threadIds) {
            try {
                const thread = await context.runQuery(
                    components.agent.threads.getThread,
                    { threadId },
                );

                if (thread && thread.userId === userId) {
                    // Get relevant messages for this thread from search results
                    const relevantMessages = searchResults.filter(
                        (message) => message.threadId === threadId,
                    );

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
        const startIndex = paginationOpts.cursor
            ? threadsWithMessages.findIndex(
                (t) => t._id === paginationOpts.cursor,
            ) + 1
            : 0;
        const endIndex = Math.min(
            startIndex + paginationOpts.numItems,
            threadsWithMessages.length,
        );
        const paginatedThreads = threadsWithMessages.slice(
            startIndex,
            endIndex,
        );

        return {
            continueCursor:
                endIndex < threadsWithMessages.length
                    ? threadsWithMessages[endIndex - 1]?._id || ""
                    : "",
            isDone: endIndex >= threadsWithMessages.length,
            page: paginatedThreads,
        };
    },
});

// Action for prompt improvement
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
            const retryAfterSeconds = Math.ceil(
                (rateLimitResult.retryAfter || 60_000) / 1000,
            );

            throw new ConvexError({
                kind: "RateLimitError",
                message: `Rate limit exceeded. Please try again in ${retryAfterSeconds} seconds.`,
                name: rateLimitName,
                retryAfter: rateLimitResult.retryAfter,
            });
        }

        // Check global rate limit as well
        const globalRateLimitResult = await checkRateLimit(
            context,
            "globalPromptImprovement",
            {
                count: 1,
                key: "global",
            },
        );

        if (!globalRateLimitResult.ok) {
            throw new ConvexError({
                kind: "RateLimitError",
                message:
                    "System is currently busy. Please try again in a moment.",
                name: "globalPromptImprovement",
                retryAfter: globalRateLimitResult.retryAfter,
            });
        }

        const model = "gemini-2.5-flash";
        const agent = getAgent(model, {
            middleware: [
                createCacheMiddleware(`${model}-improve-prompt`, context),
            ],
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

// HTTP action for prompt improvement (wrapper around the action)
export const improvePromptHttpAction = async (
    context: ActionContext,
    request: Request,
) => {
    // Parse the request body
    const body = await request.json();
    const { improvementInstructions, prompt, threadId } = body;

    if (!prompt) {
        return new Response(JSON.stringify({ error: "Missing prompt" }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        });
    }

    try {
        const result = await context.runAction(
            internal.chat.functions.improvePrompt,
            {
                improvementInstructions,

                prompt,
                threadId,
            },
        );

        return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Error improving prompt:", error);

        const errorMessage
            = error instanceof ConvexError
                ? error.message
                : "Failed to improve prompt";

        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        });
    }
};

export const getFullThreadForExport = authedQuery({
    args: {
        model: v.string(),
        threadId: v.string(),
    },
    async handler(context, { model, threadId }) {
        const userId = context.user._id;

        const thread = await context.runQuery(
            components.agent.threads.getThread,
            { threadId },
        );

        if (!thread) {
            throw new Error("Thread not found");
        }

        if (thread.userId !== userId) {
            throw new ConvexError("Unauthorized access to thread");
        }

        const agent = getAgent(model as AgentModel);

        // This logic is copied from listMessages to handle branches correctly.
        const threadRelationship = await context.runQuery(
            internal.chat.functions.getThreadRelationship,
            {
                threadId,
            },
        );

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
            const parentMessagesUpToBranch = parentMessages.page.slice(
                0,
                (threadRelationship.branchPoint || 0) + 1,
            );

            // Merge parent messages with current thread messages
            allMessages = [
                ...parentMessagesUpToBranch,
                ...currentMessages.page,
            ];
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
