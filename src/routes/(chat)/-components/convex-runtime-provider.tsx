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
import { useCallback, useMemo, useState } from "react";
import { useSession } from "@/hooks/auth-hooks";
import { api } from "@cvx/_generated/api";
import { useThreadMessages } from "@convex-dev/agent/react";
import { asAsyncIterableStream } from "assistant-stream/utils";
import { AssistantMessageAccumulator, DataStreamDecoder } from "assistant-stream";

export type ConvexMessage = {
    id: string;
    role: "user" | "assistant";
    display: string;
    createdAt?: Date;
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

const generateId = () => Math.random().toString(36).slice(2);

export const ConvexRuntimeProvider = ({ children, model, threadId }: { children: ReactNode; model: AgentModel; threadId: Id<any> }) => {
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

    const sessionData = useSession();
    const [messages, setMessages] = useState<ConvexMessage[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const paginatedMessages = useThreadMessages(api.chat.listMessages, { threadId: threadId as string, model: model, sessionToken: sessionData?.data?.session?.token }, { initialNumItems: 50 });

    const streamMessage = useCallback(async (input: string) => {        
        setIsRunning(true);
            
        const assistantId = generateId();
        const assistantMessage: ConvexMessage = {
            role: "assistant",
            id: assistantId,
            display: "",
        };

        setMessages((prev) => [...prev, assistantMessage]);

        const result = await fetch(`/convex-http/chat/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: input,
                threadId: threadId,
                model: model,
                sessionToken: sessionData?.data?.session?.token,
            }),
        });

        if (!result.ok) {
            const text = await result.text();
            
            setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, display: `Error: ${result.status} ${text}` } : m)),
            );
            
            setIsRunning(false);
            
            return;
        }

        if (!result.body) {
            throw new Error("Response body is null");
        }

        const stream = result.body.pipeThrough(new DataStreamDecoder()).pipeThrough(new AssistantMessageAccumulator());

        for await (const message of asAsyncIterableStream(stream)) {
            if (message.parts.length > 0 && message.parts[0].type === "text") {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId
                            ? {
                                  ...m,
                                  display: message.parts[0].text,
                              }
                            : m,
                    ),
                );
            }
        }

        setIsRunning(false);
    }, [threadId, model, sessionData]);

    const onNew = useCallback(
        async (m: AppendMessage) => {
            if (m.content[0]?.type !== "text") {
                throw new Error("onNew only supports user messages with string content");
            }

            const input = m.content[0].text;

            const userMessage: ConvexMessage = {
                role: "user",
                id: generateId(),
                display: input,
            };

            setMessages((prev) => [...prev, userMessage]);

            streamMessage(input);
        },
        [threadId, model, sessionData],
    );

    const onEdit = async (message: AppendMessage) => {
        const index = messages.findIndex((m) => m.id === message.parentId) + 1;
        
        const newMessages = [...messages.slice(0, index)];
        
        const editedMessage: ConvexMessage = {
          role: "user",
          display: message.content[0].text,
          id: message.id || generateId(),
        };

        newMessages.push(editedMessage);
        
        setMessages(newMessages);

        streamMessage(message.content[0].text);
    };

    const runtime = useConvexRuntime({
        onNew,
        onEdit,
        messages: [...paginatedMessages.results.map(convertMessage), ...messages],
        isRunning: isRunning,
        onReload: async (parentId: string | null) => {
            //await paginatedMessages.refetch();
        },
        adapters: {},
    });

    return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
};
