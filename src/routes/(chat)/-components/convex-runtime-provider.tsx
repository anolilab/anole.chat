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
import type { Id } from "@cvx/_generated/dataModel";
import { useMemo } from "react";
import type { FunctionReference } from "convex/server";
import { useSession } from "@/hooks/auth-hooks";
import { redirect } from "@tanstack/react-router";
import { asAsyncIterableStream } from "assistant-stream/utils";
import { AssistantMessageAccumulator, DataStreamDecoder, unstable_toolResultStream } from "assistant-stream";
import { env } from "@/lib/env";

type HeadersValue = Record<string, string> | Headers;

type ConvexModelAdapterOptions = {
    model: AgentModel;
    threadId: Id<any>;
    sessionToken: string;

    /**
     * Headers to be sent with the request.
     * Can be a static headers object or a function that returns a Promise of headers.
     */
    headers?: HeadersValue | (() => Promise<HeadersValue>);

    /**
     * Callback function to be called when the API response is received.
     */
    onResponse?: (response: Response) => void | Promise<void>;
    /**
     * Optional callback function that is called when the assistant message is finished streaming.
     */
    onFinish?: (message: ThreadMessage) => void;
    /**
     * Callback function to be called when an error is encountered.
     */
    onError?: (error: Error) => void;
    /**
     * Callback function to be called when the request is cancelled.
     * Use this option to notify the server that the user explicitly requested a cancellation.
     */
    onCancel?: () => void;
};

class ConvexModelAdapter implements ChatModelAdapter {
    private options: Omit<ConvexModelAdapterOptions, "convex" | "sendMessage">;

    constructor(options: ConvexModelAdapterOptions) {
        const { convex, sendMessage, ...rest } = options;
        this.options = rest;
    }

    async *run({ messages, runConfig, abortSignal, context, unstable_assistantMessageId, unstable_getMessage }: ChatModelRunOptions) {
        const headersValue = typeof this.options.headers === "function" ? await this.options.headers() : this.options.headers;

        abortSignal.addEventListener(
            "abort",
            () => {
                if (!abortSignal.reason?.detach) this.options.onCancel?.();
            },
            { once: true },
        );

        const headers = new Headers(headersValue);

        headers.set("Content-Type", "application/json");

        const result = await fetch(`/convex-http/chat/stream`, {
            method: "POST",
            headers,
            credentials: "same-origin",
            body: JSON.stringify({
                prompt: messages[messages.length - 1].content,
                threadId: this.options.threadId,
                model: this.options.model,
                sessionToken: this.options.sessionToken,
            }),
            signal: abortSignal,
        });

        await this.options.onResponse?.(result);

        try {
            if (!result.ok) {
                throw new Error(`Status ${result.status}: ${await result.text()}`);
            }
            if (!result.body) {
                throw new Error("Response body is null");
            }

            const stream = result.body
                .pipeThrough(new DataStreamDecoder())
                .pipeThrough(unstable_toolResultStream(context.tools, abortSignal))
                .pipeThrough(new AssistantMessageAccumulator());

            yield* asAsyncIterableStream(stream);

            this.options.onFinish?.(unstable_getMessage());
        } catch (error: unknown) {
            this.options.onError?.(error as Error);
            throw error;
        }
    }
}

export const ConvexRuntimeProvider = ({ children, model, threadId }: { children: ReactNode; model: AgentModel; threadId: Id<any> }) => {
    const sessionData = useSession();

    if (sessionData?.data?.session) {
        const adapter = useMemo(
            () => new ConvexModelAdapter({ model, threadId, sessionToken: sessionData.data.session.token }),
            [model, threadId, sessionData.data?.session.token],
        );

        const runtime = useLocalRuntime(adapter);

        return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
    }

    throw redirect({
        to: "/login",
        replace: true,
    });
};
