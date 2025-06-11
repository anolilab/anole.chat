"use client";

import {
    AssistantRuntimeProvider,
    useExternalStoreRuntime,
    type AppendMessage,
    type ExternalStoreAdapter,
    type ThreadMessageLike,
    useExternalMessageConverter,
} from "@assistant-ui/react";
import type { ReactNode } from "react";
import type { AgentModel } from "convex/agents";
import type { Id } from "@cvx/_generated/dataModel";
import { useCallback, useMemo } from "react";
import { useSession } from "@/hooks/auth-hooks";
import { redirect } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "@cvx/_generated/api";
import { useThreadMessages } from "@convex-dev/agent/react";

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

const convexToThreadMessage = <T,>(converter: (message: T) => ConvexMessage, rawMessage: T): ThreadMessageLike => {
    console.log(rawMessage)
    const message = converter(rawMessage);

    return {
        id: message.id,
        role: message.role,
        content: [{ type: "text", text: message.display }],
        createdAt: message.createdAt,
    };
};

const useConvexRuntime = <T extends WeakKey>(adapter: ConvexAdapter<T>) => {
    const onNew = adapter.onNew;
    
    if (!onNew) {
        throw new Error("You must pass a onNew function to useConvexRuntime");
    }

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
    const sendMessage = useMutation(api.chat.sendMessage);

    const paginatedMessages = useThreadMessages(api.chat.listMessages, { threadId: threadId as string, model: model, sessionToken: sessionData?.data?.session?.token }, { initialNumItems: 50 });

    const onNew = useCallback(
        async (m: AppendMessage) => {
            if (m.content[0]?.type !== "text") {
                throw new Error("onNew only supports user messages with string content");
            }
            
            const input = m.content[0].text;
            
            await sendMessage({
                prompt: input,
                threadId: threadId,
                model: model,
                sessionToken: sessionData?.data?.session?.token,
            });
        },
        [sendMessage, threadId, model, sessionData],
    );

    const convertMessage = useCallback((message: any): ConvexMessage => {
        const role = message.message.role;
        const content = message.message.content;

        let displayContent: string;
        if (typeof content === "string") {
            displayContent = content;
        } else if (Array.isArray(content)) {
            displayContent = content
                .map((part: any) => {
                    if (part.type === "text") {
                        return part.text;
                    }

                    return `[unsupported content: ${part.type}]`;
                })
                .join("");
        } else {
            displayContent = "";
        }

        return {
            id: message._id,
            role: role,
            display: displayContent,
            createdAt: new Date(message._creationTime),
        };
    }, []);

    const runtime = useConvexRuntime({
        onNew,
        messages: paginatedMessages.results?.map(convertMessage) ?? [],
        isRunning: paginatedMessages.isLoading,
        onReload: async () => {
            // await paginatedMessages.refetch();
        },
        adapters: {
            
        }
    });

    return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
};
