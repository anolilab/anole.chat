"use client";

import {
    AssistantRuntimeProvider,
    useLocalRuntime,
    type ChatModelAdapter,
    type ChatModelRunOptions,
    type TextContentPart,
    type ThreadMessage,
} from "@assistant-ui/react";
import { useConvex, useMutation, type ConvexReactClient, type ReactMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { ReactNode } from "react";
import type { AgentModel } from "convex/agents";
import type { Doc, Id } from "@cvx/_generated/dataModel";
import { useMemo } from "react";
import type { FunctionReference } from "convex/server";
import { useSession } from "@/hooks/auth-hooks";
import { redirect } from "@tanstack/react-router";

type ConvexModelAdapterOptions = {
    convex: ConvexReactClient;
    sendMessage: ReactMutation<FunctionReference<"mutation">>;
    model: AgentModel;
    threadId: Id<any>;
    sessionToken: string;
    onFinish?: (message: ThreadMessage) => void;
    onError?: (error: Error) => void;
};

class ConvexModelAdapter implements ChatModelAdapter {
    private sendMessage: (args: { threadId: Id<any>; prompt: string; model: string, sessionToken: string }) => Promise<any>;
    private options: Omit<ConvexModelAdapterOptions, "convex" | "sendMessage">;
    private convex: ConvexReactClient;

    constructor(options: ConvexModelAdapterOptions) {
        const { convex, sendMessage, ...rest } = options;
        this.options = rest;
        this.convex = convex;
        this.sendMessage = sendMessage;
    }

    async *run({ messages, abortSignal, unstable_getMessage }: ChatModelRunOptions) {
        try {
            const lastMessage = messages[messages.length - 1];

            if (lastMessage.role !== "user") {
                return;
            }

            const textContent = lastMessage.content.find((c) => c.type === "text") as TextContentPart | undefined;

            if (!textContent) {
                return;
            }

            await this.sendMessage({
                threadId: this.options.threadId,
                prompt: textContent.text,
                model: this.options.model,
                sessionToken: this.options.sessionToken,
            });

            let lastSynced = -1;
            let completeText = "";

            while (true) {
                if (abortSignal.aborted) {
                    this.options.onError?.(new Error("Aborted"));
                    return;
                }

                const result = await this.convex.query(api.chat.getMessages, {
                    threadId: this.options.threadId,
                    // @ts-ignore - The type of streamArgs seems to have changed.
                    streamArgs: { after: lastSynced },
                    model: this.options.model,
                    sessionToken: this.options.sessionToken,
                });

                if (!result || !result.streams) continue;

                if (Array.isArray(result.streams)) {
                    for (const stream of result.streams) {
                        for (const part of stream as any[]) {
                            if (part.type === "text-delta") {
                                completeText += part.textDelta;
                                yield { content: [{ type: "text" as const, text: completeText }] };
                            }
                            lastSynced = Math.max(lastSynced, part.syncId);
                        }
                    }
                }

                const assistantMessages = result.page.filter(
                    (m: Doc<any>): m is Doc<any> =>
                        (m as any).role === "assistant" && (m as any).content.some((c: any) => c.type === "text" && c.text.length > 0),
                );
                const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];

                if (lastAssistantMessage && lastAssistantMessage._creationTime > (lastMessage.createdAt?.getTime() ?? 0)) {
                    const textPart = ((lastAssistantMessage as any).content as any[]).find((c) => c.type === "text");

                    if (textPart && "text" in textPart) {
                        yield { content: [{ type: "text" as const, text: textPart.text }] };
                    }

                    this.options.onFinish?.(unstable_getMessage());

                    return;
                }

                await new Promise((resolve) => setTimeout(resolve, 200));
            }
        } catch (e) {
            this.options.onError?.(e as Error);
            throw e;
        }
    }
}

export const ConvexRuntimeProvider = ({ children, model, threadId }: { children: ReactNode; model: AgentModel; threadId: Id<any> }) => {
    const sessionData = useSession();
    const convex = useConvex();
    const sendMessage = useMutation(api.chat.sendMessage);

    if (sessionData?.data?.session) {
        const adapter = useMemo(
            () => new ConvexModelAdapter({ convex, sendMessage, model, threadId, sessionToken: sessionData.data.session.token }),
            [convex, sendMessage, model, threadId, sessionData.data?.session.token]
        );

        const runtime = useLocalRuntime(adapter);

        return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
    }


    throw redirect({
        to: "/login",
        replace: true,
    });
};
