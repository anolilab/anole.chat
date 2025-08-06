"use client";

import { useChat } from "@ai-sdk/react";
import useMounted from "@anole/ui/hooks/use-mounted";
import useToRef from "@anole/ui/hooks/use-to-ref";
import cn from "@anole/ui/utils/cn";
import type { UIMessage } from "ai";
import clsx from "clsx";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useShallow } from "zustand/shallow";

import type { ChatApiSchemaRequestBody, ChatModel, ClientToolInvocation } from "@/types/chat";

import { appStore } from "../../store";
import PromptInput from "../prompt-input";
import { ChatGreeting } from "./chat-greeting";
import { ErrorMessage, PreviewMessage } from "./message";
import Think from "./think";

type Properties = {
    initialMessages: UIMessage[];
    selectedChatModel?: string;
    slots?: {
        emptySlot?: ReactNode;
        inputBottomSlot?: ReactNode;
    };
    threadId: string;
};

const vercelAISdkV4ToolInvocationIssueCatcher = (message: UIMessage) => {
    if (message.role !== "assistant")
        return;

    const lastPart = message.parts.at(-1);

    if (lastPart?.type !== "tool-invocation")
        return;

    if (!message.toolInvocations) {
        message.toolInvocations = [lastPart.toolInvocation];
    }
};

const DeleteThreadPopup = ({ onClose, open, threadId }: { onClose: () => void; open: boolean; threadId: string }) => {
    const t = useTranslations();
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const handleDelete = useCallback(() => {
        setIsDeleting(true);
        safe(() => deleteThreadAction(threadId))
            .watch(() => setIsDeleting(false))
            .ifOk(() => {
                toast.success(t("Chat.Thread.threadDeleted"));
                router.push("/");
            })
            .ifFail(() => toast.error(t("Chat.Thread.failedToDeleteThread")))
            .watch(() => onClose());
    }, [threadId, router]);

    return (
        <Dialog onOpenChange={onClose} open={open}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("Chat.Thread.deleteChat")}</DialogTitle>
                    <DialogDescription>{t("Chat.Thread.areYouSureYouWantToDeleteThisChatThread")}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={onClose} variant="ghost">
                        {t("Common.cancel")}
                    </Button>
                    <Button autoFocus onClick={handleDelete} variant="destructive">
                        {t("Common.delete")}
                        {isDeleting && <Loader className="ml-2 size-3.5 animate-spin" />}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const Chat = ({ initialMessages, slots, threadId }: Properties) => {
    const containerReference = useRef<HTMLDivElement>(null);

    const [thinking, setThinking] = useState(false);

    const [appStoreMutate, model, toolChoice, allowedAppDefaultToolkit, allowedMcpServers, threadList, threadMentions] = appStore(
        useShallow((state) => [
            state.mutate,
            state.chatModel,
            state.toolChoice,
            state.allowedAppDefaultToolkit,
            state.allowedMcpServers,
            state.threadList,
            state.threadMentions,
        ]),
    );

    const [showParticles, setShowParticles] = useState(false);

    const { addToolResult, append, error, input, messages, reload, setInput, setMessages, status, stop } = useChat({
        api: "/convex-http/api/chat/stream",
        experimental_prepareRequestBody: ({ messages, requestBody }) => {
            const lastMessage = messages.at(-1)!;

            vercelAISdkV4ToolInvocationIssueCatcher(lastMessage);
            const request: ChatApiSchemaRequestBody = {
                allowedAppDefaultToolkit: latestReference.current.allowedAppDefaultToolkit,
                allowedMcpServers: latestReference.current.allowedMcpServers,
                chatModel: (requestBody as { model: ChatModel })?.model ?? latestReference.current.model,
                id: latestReference.current.threadId,
                mentions: latestReference.current.mentions,
                message: lastMessage,
                thinking,
                toolChoice: latestReference.current.toolChoice,
            };

            return request;
        },
        experimental_throttle: 100,
        generateId: uuidv4,
        id: threadId,
        initialMessages,
        onError: (error) => {
            console.error(error);
            toast.error(error.message || "An error occured, please try again!");
        },
        onFinish() {},
        sendExtraMessageFields: true,
    });

    const [isDeleteThreadPopupOpen, setIsDeleteThreadPopupOpen] = useState(false);

    const mounted = useMounted();

    const latestReference = useToRef({
        allowedAppDefaultToolkit,
        allowedMcpServers,
        mentions: threadMentions[threadId],
        messages,
        model,
        threadId,
        threadList,
        toolChoice,
    });

    const isLoading = useMemo(() => status === "streaming" || status === "submitted", [status]);

    const emptyMessage = useMemo(() => messages.length === 0 && !error, [messages.length, error]);

    const isInitialThreadEntry = useMemo(() => initialMessages.length > 0 && initialMessages.at(-1)?.id === messages.at(-1)?.id, [messages]);

    const needSpaceClass = useCallback(
        (index: number) => {
            if (error || isInitialThreadEntry || index !== messages.length - 1) {
                return false;
            }

            const message = messages[index];

            if (message.role === "user") {
                return false;
            }

            if (message.parts.at(-1)?.type === "step-start") {
                return false;
            }

            return true;
        },
        [messages, error],
    );

    const [isExecutingProxyToolCall, setIsExecutingProxyToolCall] = useState(false);

    const isPendingToolCall = useMemo(() => {
        if (status !== "ready") {
            return false;
        }

        const lastMessage = messages.at(-1);

        if (lastMessage?.role !== "assistant") {
            return false;
        }

        const lastPart = lastMessage.parts.at(-1);

        if (!lastPart)
            return false;

        if (lastPart.type !== "tool-invocation") {
            return false;
        }

        if (lastPart.toolInvocation.state === "result") {
            return false;
        }

        return true;
    }, [status, messages]);

    const proxyToolCall = useCallback(
        async (result: ClientToolInvocation) => {
            setIsExecutingProxyToolCall(true);

            try {
                const lastMessage = latestReference.current.messages.at(-1)!;
                const lastPart = lastMessage.parts.at(-1)! as Extract<UIMessage["parts"][number], { type: "tool-invocation" }>;

                await addToolResult({
                    result,
                    toolCallId: lastPart.toolInvocation.toolCallId,
                });
            } finally {
                setIsExecutingProxyToolCall(false);
            }
        },
        [addToolResult, latestReference],
    );

    const handleThinkingChange = useCallback((thinking: boolean) => {
        setThinking(thinking);
    }, []);

    const space = useMemo(() => {
        if (!isLoading)
            return false;

        const lastMessage = messages.at(-1);

        if (lastMessage?.role == "user")
            return "think";

        const lastPart = lastMessage?.parts.at(-1);

        if (lastPart?.type == "step-start")
            return lastMessage?.parts.length == 1 ? "think" : "space";

        return false;
    }, [isLoading, messages.at(-1)]);

    const particle = useMemo(() => {
        if (!showParticles)
            return;

        return (
            <>
                <div className="fade-in animate-in absolute top-0 left-0 z-10 h-full w-full duration-5000">
                    <LightRays />
                </div>
                <div className="fade-in animate-in absolute top-0 left-0 z-10 h-full w-full duration-5000">
                    <Particles particleBaseSize={10} particleCount={400} />
                </div>

                <div className="fade-in animate-in absolute top-0 left-0 z-10 h-full w-full duration-5000">
                    <div className="from-background z-20 h-full w-full bg-gradient-to-t to-transparent to-50%" />
                </div>
                <div className="fade-in animate-in absolute top-0 left-0 z-10 h-full w-full duration-5000">
                    <div className="from-background z-20 h-full w-full bg-gradient-to-l to-transparent to-20%" />
                </div>
                <div className="fade-in animate-in absolute top-0 left-0 z-10 h-full w-full duration-5000">
                    <div className="from-background z-20 h-full w-full bg-gradient-to-r to-transparent to-20%" />
                </div>
            </>
        );
    }, [showParticles]);

    const handleFocus = useCallback(() => {
        setShowParticles(false);
        debounce(() => setShowParticles(true), 30_000);
    }, []);

    useEffect(() => {
        appStoreMutate({ currentThreadId: threadId });

        return () => {
            appStoreMutate({ currentThreadId: null });
        };
    }, [threadId]);

    useEffect(() => {
        if (isInitialThreadEntry) {
            containerReference.current?.scrollTo({
                behavior: "instant",
                top: containerReference.current?.scrollHeight,
            });
        }
    }, [isInitialThreadEntry]);

    /*
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const { messages } = latestReference.current;

            if (messages.length === 0) {
                return;
            }

            const isLastMessageCopy = isShortcutEvent(e, Shortcuts.lastMessageCopy);

            if (!isLastMessageCopy)
                return;

            e.preventDefault();
            e.stopPropagation();

            if (isLastMessageCopy) {
                const lastMessage = messages.at(-1);
                const lastMessageText = lastMessage!.parts.filter((part) => part.type === "text")?.at(-1)?.text;

                if (!lastMessageText)
                    return;

                navigator.clipboard.writeText(lastMessageText);
                toast.success("Last message copied to clipboard");
            }
        };

        globalThis.addEventListener("keydown", handleKeyDown);

        return () => globalThis.removeEventListener("keydown", handleKeyDown);
    }, []);
    */

    useEffect(() => {
        if (mounted) {
            handleFocus();
        }
    }, [input]);

    return (
        <>
            {particle}
            <div className={cn(emptyMessage && "justify-center pb-24", "relative flex h-full min-w-0 flex-col")}>
                {emptyMessage
                    ? slots?.emptySlot
                        ? slots.emptySlot
                        : (
                            <ChatGreeting />
                        )
                    : (
                        <>
                            <div className="flex flex-col gap-2 overflow-y-auto py-6" onScroll={handleFocus} ref={containerReference}>
                                {messages.map((message, index) => {
                                    const isLastMessage = messages.length - 1 === index;

                                    return (
                                        <PreviewMessage
                                            className={needSpaceClass(index) ? "min-h-[calc(55dvh-40px)]" : ""}
                                            isError={!!error && isLastMessage}
                                            isLastMessage={isLastMessage}
                                            isLoading={isLoading || isPendingToolCall}
                                            key={index}
                                            message={message}
                                            messageIndex={index}
                                            onProxyToolCall={isPendingToolCall && !isExecutingProxyToolCall && isLastMessage ? proxyToolCall : undefined}
                                            reload={reload}
                                            setMessages={setMessages}
                                            status={status}
                                            threadId={threadId}
                                        />
                                    );
                                })}
                                {space && (
                                    <>
                                        <div className="relative mx-auto w-full max-w-3xl px-6">
                                            <div className={space === "space" ? "opacity-0" : ""}>
                                                <Think />
                                            </div>
                                        </div>
                                        <div className="min-h-[calc(55dvh-56px)]" />
                                    </>
                                )}

                                {error && <ErrorMessage error={error} />}
                                <div className="min-h-52 min-w-0" />
                            </div>
                        </>
                    )}
                <div className={clsx(messages.length && "absolute bottom-14", "w-full")}>
                    <PromptInput
                        append={append}
                        input={input}
                        isLoading={isLoading || isPendingToolCall}
                        onFocus={isFirstTime ? undefined : handleFocus}
                        onStop={stop}
                        onThinkingChange={handleThinkingChange}
                        setInput={setInput}
                        thinking={thinking}
                        threadId={threadId}
                    />
                    {slots?.inputBottomSlot}
                </div>
                <DeleteThreadPopup onClose={() => setIsDeleteThreadPopupOpen(false)} open={isDeleteThreadPopupOpen} threadId={threadId} />
            </div>
        </>
    );
};

export default Chat;
