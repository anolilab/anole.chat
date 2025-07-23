import { getFile } from "@convex-dev/agent";
import { throttle } from "@tanstack/pacer";
import { ConvexError } from "convex/values";

import { components, internal } from "../_generated/api";
import type { ActionCtx as ActionContext } from "../_generated/server";
import type { AgentModel } from "../ai/lib/agents";
import { getAgent } from "../ai/lib/agents";
import { getCurrentUserInternal } from "../auth/lib/helper";

// HTTP action for prompt improvement (wrapper around the action)
export const improvePromptHttpAction = async (context: ActionContext, request: Request) => {
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
        const result = await context.runAction(internal.chat.functions.improvePrompt, {
            improvementInstructions,

            prompt,
            threadId,
        });

        return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Error improving prompt:", error);

        const errorMessage = error instanceof ConvexError ? error.message : "Failed to improve prompt";

        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        });
    }
};

export const streamHttpAction = async (context: ActionContext, request: Request) => {
    const { fileIds, model, prompt, threadId } = (await request.json()) as {
        fileIds?: string[];
        model: string;
        prompt?: string;
        threadId?: string;
    };

    const user = await getCurrentUserInternal(context);

    if (!user) {
        return new Response(
            JSON.stringify({ error: "Not authenticated", message: "User not found" }),
            { headers: { "Content-Type": "application/json" }, status: 401 },
        );
    }

    const { userId } = user;

    const agent = getAgent(model as AgentModel);

    const { thread } = threadId ? await agent.continueThread(context, { threadId, userId }) : await agent.createThread(context, { userId });

    // Create message content with file support
    const messageContent: any[] = [];

    if (fileIds) {
        try {
            for await (const fileId of fileIds) {
                // @ts-ignore - Ignoring TypeScript errors for getFile function
                const { filePart, imagePart } = await getFile(context, components.agent, fileId);

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

    await context.scheduler.runAfter(0, internal.chat.functions.createTitleChat, {
        prompt: prompt ?? " ", // TODO: add prompt based on image
        threadId: thread.threadId,
    });

    await context.scheduler.runAfter(0, internal.chat.functions.createSummarizeChat, {
        threadId: thread.threadId,
        userId,
    });

    const result = await thread.streamText({ promptMessageId: messageId }, { saveStreamDeltas: true });

    return result.toDataStreamResponse({
        sendReasoning: true,
        sendSources: true,
        sendUsage: true,
    });
};
