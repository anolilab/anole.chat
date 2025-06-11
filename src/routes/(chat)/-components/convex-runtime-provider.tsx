"use client";

import {
    AssistantRuntimeProvider,
    useExternalStoreRuntime,
    type ChatModelAdapter,
    type ChatModelRunOptions,
    type ThreadMessage,
    type AppendMessage,
    type ExternalStoreAdapter,
    type ThreadMessageLike,
    useExternalMessageConverter,
} from "@assistant-ui/react";
import type { ReactNode } from "react";
import type { AgentModel } from "convex/agents";
import type { Id } from "@cvx/_generated/dataModel";
import { useCallback, useMemo, useState } from "react";
import { useSession } from "@/hooks/auth-hooks";
import { redirect } from "@tanstack/react-router";
import { asAsyncIterableStream } from "assistant-stream/utils";
import { AssistantMessageAccumulator, DataStreamDecoder, unstable_toolResultStream } from "assistant-stream";

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
export type ConvexMessage = {
    id?: string | undefined;
    role: "user" | "assistant";
    display: ReactNode;
    createdAt?: Date | undefined;
};

type ConvexAdapterBase<T> = {
    isRunning?: boolean | undefined;
    messages: T[];

    onNew?: (message: AppendMessage) => Promise<void>;
    onEdit?: ((message: AppendMessage) => Promise<void>) | undefined;
    onReload?: ((parentId: string | null) => Promise<void>) | undefined;
    convertMessage?: ((message: T) => ConvexMessage) | undefined;

    adapters?: ExternalStoreAdapter["adapters"] | undefined;
};

type ConvexMessageConverter<T> = {
    convertMessage: (message: T) => ConvexMessage;
};

type ConvexAdapter<T = ConvexMessage> = ConvexAdapterBase<T> & (T extends ConvexMessage ? object : ConvexMessageConverter<T>);

const symbolInternalConvexExtras = Symbol("internal-convex-extras");
type ConvexThreadExtras =
    | {
          [symbolInternalConvexExtras]?: {
              convertFn: (message: any) => ConvexMessage;
          };
      }
    | undefined;

class ConvexModelAdapter implements ChatModelAdapter {
    private options: Omit<ConvexModelAdapterOptions, "convex" | "sendMessage">;

    constructor(options: ConvexModelAdapterOptions) {
        this.options = options;
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

const convexToThreadMessage = <T,>(converter: (message: T) => ConvexMessage, rawMessage: T): ThreadMessageLike => {
    const message = converter(rawMessage);

    return {
        id: message.id,
        role: message.role,
        content: [{ type: "text", text: "[Developer: Please set up RSCDisplay]" }],
        createdAt: message.createdAt,
    };
};

const useConvexRuntime = <T extends WeakKey>(adapter: ConvexAdapter<T>) => {
    const onNew = adapter.onNew;
    if (!onNew) throw new Error("You must pass a onNew function to useConvexRuntime");

    const convertFn = useMemo(() => {
        return adapter.convertMessage?.bind(adapter) ?? ((m: T) => m as ConvexMessage);
    }, [adapter]);
    const callback = useCallback(
        (m: T) => {
            return convexToThreadMessage(convertFn, m);
        },
        [convertFn],
    );

    const messages = useExternalMessageConverter({
        callback,
        isRunning: adapter.isRunning ?? false,
        messages: adapter.messages,
    });

    const eAdapter: ExternalStoreAdapter = {
        isRunning: adapter.isRunning,
        messages,
        onNew,
        onEdit: adapter.onEdit,
        onReload: adapter.onReload,
        adapters: adapter.adapters,
        unstable_capabilities: {
            copy: false,
        },
        extras: {
            [symbolInternalConvexExtras]: { convertFn },
        },
    };

    return useExternalStoreRuntime(eAdapter);
};

export const ConvexRuntimeProvider = ({ children, model, threadId }: { children: ReactNode; model: AgentModel; threadId: Id<any> }) => {
    const sessionData = useSession();

    if (sessionData?.data?.session) {
        const adapter = useMemo(
            () => new ConvexModelAdapter({ model, threadId, sessionToken: sessionData.data.session.token }),
            [model, threadId, sessionData.data?.session.token],
        );

        const runtime = useConvexRuntime(adapter as unknown as ConvexAdapter<ConvexMessage>);

        return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
    }

    throw redirect({
        to: "/login",
        replace: true,
    });
};
