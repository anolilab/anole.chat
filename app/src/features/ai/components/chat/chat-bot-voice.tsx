"use client";

import { Alert, AlertDescription, AlertTitle } from "@anole/ui/components/alert";
import { Button } from "@anole/ui/components/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@anole/ui/components/dialog";
import { Drawer, DrawerContent, DrawerPortal, DrawerTitle } from "@anole/ui/components/drawer";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@anole/ui/components/dropdown-menu";
import { GeminiIcon } from "@anole/ui/components/gemini-icon";
import JsonView from "@anole/ui/components/json-view";
import { MessageLoading } from "@anole/ui/components/message-loading";
import { OpenAIIcon } from "@anole/ui/components/openai-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import type { TextPart, UIMessage } from "ai";
import { isShortcutEvent, Shortcuts } from "lib/keyboard-shortcuts";
import { nextTick } from "lib/utils";
import {
    CheckIcon,
    ChevronRight,
    Loader,
    MessageSquareMoreIcon,
    MessagesSquareIcon,
    MicIcon,
    MicOffIcon,
    PhoneIcon,
    Settings2Icon,
    TriangleAlertIcon,
    WrenchIcon,
    XIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { safe } from "ts-safe";
import { useShallow } from "zustand/shallow";

import type { ToolInvocationUIPart } from "@/types/chat";

import type { UIMessageWithCompleted } from "../../lib/speech";
import { DEFAULT_VOICE_TOOLS } from "../../lib/speech";
import { OPENAI_VOICE, useOpenAIVoiceChat as OpenAIVoiceChat } from "../../lib/speech/open-ai/use-voice-chat.openai";
import { appStore } from "../../store";
import { EnabledMcpToolsDropdown } from "../enabled-mcp-tools-dropdown";
import { ToolMessagePart } from "./message-parts";

const isNotEmptyUIMessage = (message: UIMessage) =>
    message.parts.some((v) => {
        if (v.type === "text") {
            return v.text.trim() !== "";
        }

        return true;
    });

function mergeConsecutiveMessages(messages: UIMessage[]): UIMessage[] {
    if (messages.length === 0)
        return [];

    const merged: UIMessage[] = [];
    let current = { ...messages[0], parts: [...messages[0].parts] };

    for (let index = 1; index < messages.length; index++) {
        const message = messages[index];

        if (message.role === current.role) {
            current.parts = [...current.parts, ...message.parts];
        } else {
            merged.push(current);
            current = { ...message, parts: [...message.parts] };
        }
    }

    merged.push(current);

    return merged;
}

const prependTools = [
    {
        id: "Browser",
        name: "Browser",
        tools: DEFAULT_VOICE_TOOLS.map((tool) => {
            return {
                description: tool.description,
                name: tool.name,
            };
        }),
    },
];

export const ChatBotVoice = () => {
    const { t } = useLingui();
    const [appStoreMutate, voiceChat, model] = appStore(useShallow((state) => [state.mutate, state.voiceChat, state.chatModel]));

    const [isClosing, setIsClosing] = useState(false);
    const startAudio = useRef<HTMLAudioElement>(null);
    const [useCompactView, setUseCompactView] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    // const useVoiceChat = useMemo<VoiceChatHook>(() => {
    //   switch (voiceChat.options.provider) {
    //     case "openai":
    //       return OpenAIVoiceChat;
    //     default:
    //       return OpenAIVoiceChat;
    //   }
    // }, [voiceChat.options.provider]);

    const { error, isActive, isAssistantSpeaking, isListening, isLoading, isUserSpeaking, messages, start, startListening, stop, stopListening }
        = OpenAIVoiceChat(voiceChat.options.providerOptions);

    const startWithSound = useCallback(() => {
        if (!startAudio.current) {
            startAudio.current = new Audio("/sounds/start_voice.ogg");
        }

        start().then(() => {
            startAudio.current?.play().catch(() => {});
        });
    }, [start]);

    const endVoiceChat = useCallback(async () => {
        setIsClosing(true);
        await safe(() => stop());
        await safe(async () => {
            if (!voiceChat.threadId)
                return;

            const saveMessages = messages.filter((v) => v.completed && isNotEmptyUIMessage(v));

            if (saveMessages.length === 0) {
                return;
            }

            await fetch(`/api/chat/${voiceChat.threadId}`, {
                body: JSON.stringify({
                    chatModel: model,
                    messages: mergeConsecutiveMessages(saveMessages),
                    projectId: voiceChat.projectId,
                }),
                method: "POST",
            });

            return true;
        }).ifOk((isSaved) => {
            if (isSaved) {
                nextTick().then(() => {
                    mutate("/api/thread/list");
                    navigate({ to: `/chat/${voiceChat.threadId}` });

                    if (location.pathname === `/chat/${voiceChat.threadId}`) {
                        // Note: TanStack Router doesn't have a direct refresh method like Next.js
                        // The navigation will trigger a re-render which should be sufficient
                    }
                });
            }
        });
        setIsClosing(false);
        appStoreMutate({
            voiceChat: {
                ...voiceChat,
                isOpen: false,
            },
        });
    }, [messages, voiceChat.threadId, voiceChat.projectId, model]);

    const statusMessage = useMemo(() => {
        if (isLoading) {
            return (
                <p className="fade-in animate-in duration-3000" key="start">
                    {t`VoiceChat.preparing`}
                </p>
            );
        }

        if (!isActive) {
            return (
                <p className="fade-in animate-in duration-3000" key="start">
                    {t`VoiceChat.startVoiceChat`}
                </p>
            );
        }

        if (!isListening) {
            return (
                <p className="fade-in animate-in duration-3000" key="stop">
                    {t`VoiceChat.yourMicIsOff`}
                </p>
            );
        }

        if (!isAssistantSpeaking && messages.length === 0) {
            return (
                <p className="fade-in animate-in duration-3000" key="ready">
                    {t`VoiceChat.readyWhenYouAreJustStartTalking`}
                </p>
            );
        }

        if (isUserSpeaking && useCompactView) {
            return <MessageLoading className="text-muted-foreground" />;
        }

        if (!isAssistantSpeaking && !isUserSpeaking) {
            return (
                <p className="delayed-fade-in" key="ready">
                    {t`VoiceChat.readyWhenYouAreJustStartTalking`}
                </p>
            );
        }
    }, [isAssistantSpeaking, isUserSpeaking, isActive, isLoading, isListening, messages.length, useCompactView]);

    useEffect(
        () => () => {
            if (isActive) {
                stop();
            }
        },
        [voiceChat.options, isActive],
    );

    useEffect(() => {
        if (voiceChat.isOpen) {
            startWithSound();
        } else if (isActive) {
            stop();
        }
    }, [voiceChat.isOpen]);

    useEffect(() => {
        if (error && isActive) {
            toast.error(error.message);
            stop();
        }
    }, [error]);

    useEffect(() => {
        if (voiceChat.isOpen)
            return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const isVoiceChatEvent = isShortcutEvent(e, Shortcuts.toggleVoiceChat);

            if (isVoiceChatEvent) {
                e.preventDefault();
                e.stopPropagation();
                appStoreMutate((previous) => {
                    return {
                        voiceChat: {
                            ...previous.voiceChat,
                            isOpen: true,
                            projectId: undefined,
                            threadId: undefined,
                        },
                    };
                });
            }
        };

        globalThis.addEventListener("keydown", handleKeyDown);

        return () => globalThis.removeEventListener("keydown", handleKeyDown);
    }, [voiceChat.isOpen]);

    return (
        <Drawer direction="top" dismissible={false} open={voiceChat.isOpen}>
            <DrawerPortal>
                <DrawerContent className="bg-card flex h-full max-h-[100vh]! flex-col rounded-none! border-none!">
                    <div className="flex h-full w-full flex-col">
                        <div
                            className="flex w-full gap-2 p-6"
                            style={{
                                userSelect: "text",
                            }}
                        >
                            <div className="flex items-center">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button onClick={() => setUseCompactView(!useCompactView)} size="icon" variant="secondary">
                                            {useCompactView ? <MessageSquareMoreIcon /> : <MessagesSquareIcon />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{useCompactView ? t`VoiceChat.compactDisplayMode` : t`VoiceChat.conversationDisplayMode`}</TooltipContent>
                                </Tooltip>
                            </div>
                            <DrawerTitle className="flex w-full items-center gap-2">
                                <EnabledMcpToolsDropdown align="start" prependTools={prependTools} side="bottom" />

                                <div className="flex-1" />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="icon" variant="ghost">
                                            <Settings2Icon className="text-foreground size-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="min-w-40" side="left">
                                        <DropdownMenuGroup className="cursor-pointer">
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger className="flex cursor-pointer items-center gap-2" icon="">
                                                    <OpenAIIcon className="fill-foreground size-3.5 stroke-none" />
                                                    Open AI
                                                </DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        {Object.entries(OPENAI_VOICE).map(([key, value]) => (
                                                            <DropdownMenuItem
                                                                className="flex cursor-pointer items-center justify-between"
                                                                key={key}
                                                                onClick={() =>
                                                                    appStoreMutate({
                                                                        voiceChat: {
                                                                            ...voiceChat,
                                                                            options: {
                                                                                provider: "openai",
                                                                                providerOptions: {
                                                                                    voice: value,
                                                                                },
                                                                            },
                                                                        },
                                                                    })}
                                                            >
                                                                {key}

                                                                {value === voiceChat.options.providerOptions?.voice && <CheckIcon className="size-3.5" />}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSub>
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger className="text-muted-foreground flex items-center gap-2" icon="">
                                                        <GeminiIcon className="size-3.5" />
                                                        Gemini
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuPortal>
                                                        <DropdownMenuSubContent>
                                                            <div className="text-muted-foreground p-6 text-xs">Not Implemented Yet</div>
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuPortal>
                                                </DropdownMenuSub>
                                            </DropdownMenuSub>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </DrawerTitle>
                        </div>
                        <div className="mx-auto min-h-0 w-full flex-1">
                            {error
                                ? (
                                    <div className="mx-auto max-w-3xl">
                                        <Alert variant="destructive">
                                            <TriangleAlertIcon className="size-4" />
                                            <AlertTitle className="">Error</AlertTitle>
                                            <AlertDescription>{error.message}</AlertDescription>

                                            <AlertDescription className="my-4">
                                                <p className="text-muted-foreground">{t`VoiceChat.pleaseCloseTheVoiceChatAndTryAgain`}</p>
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                )
                                : null}
                            {isLoading
                                ? (
                                    <div className="flex-1" />
                                )
                                : (
                                    <div className="h-full w-full">
                                        {useCompactView ? <CompactMessageView messages={messages} /> : <ConversationView messages={messages} />}
                                    </div>
                                )}
                        </div>
                        <div className="relative flex w-full items-center justify-center gap-4 p-6">
                            <div className="text-muted-foreground absolute -top-5 left-0 flex w-full items-center justify-center text-sm">{statusMessage}</div>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        className={cn(
                                            "rounded-full p-6 transition-colors duration-300",

                                            isLoading
                                                ? "bg-accent-foreground text-accent animate-pulse"
                                                : isActive
                                                    ? isListening
                                                        ? isUserSpeaking
                                                            ? "bg-input text-foreground"
                                                            : ""
                                                        : "bg-destructive/30 text-destructive hover:bg-destructive/10"
                                                    : "bg-green-500/10 text-green-500 hover:bg-green-500/30",
                                        )}
                                        disabled={isClosing || isLoading}
                                        onClick={() => {
                                            if (!isActive) {
                                                startWithSound();
                                            } else if (isListening) {
                                                stopListening();
                                            } else {
                                                startListening();
                                            }
                                        }}
                                        size="icon"
                                        variant="secondary"
                                    >
                                        {isLoading || isClosing
                                            ? (
                                                <Loader className="size-6 animate-spin" />
                                            )
                                            : isActive
                                                ? isListening
                                                    ? (
                                                        <MicIcon
                                                            className={`size-6 ${isUserSpeaking ? "text-primary" : "text-muted-foreground transition-colors duration-300"}`}
                                                        />
                                                    )
                                                    : (
                                                        <MicOffIcon className="size-6" />
                                                    )
                                                : (
                                                    <PhoneIcon className="size-6 fill-green-500 stroke-none" />
                                                )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {isActive ? isListening ? t`VoiceChat.closeMic` : t`VoiceChat.openMic` : t`VoiceChat.startConversation`}
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        className="rounded-full p-6"
                                        disabled={isLoading || isClosing}
                                        onClick={endVoiceChat}
                                        size="icon"
                                        variant="secondary"
                                    >
                                        <XIcon className="text-foreground size-6" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t`VoiceChat.endConversation`}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </DrawerContent>
            </DrawerPortal>
        </Drawer>
    );
};

const ConversationView = ({ messages }: { messages: UIMessageWithCompleted[] }) => {
    const reference = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (reference.current) {
            reference.current.scrollTo({
                behavior: "smooth",
                top: reference.current.scrollHeight,
            });
        }
    }, [messages.length]);

    return (
        <div className="h-full w-full overflow-y-auto select-text" ref={reference}>
            <div className="mx-auto flex min-h-0 max-w-4xl min-w-0 flex-col gap-6 px-6 pb-44">
                {messages.map((message) => (
                    <div
                        className={cn("flex px-4 py-3", message.role == "user" && "text-foreground bg-input/40 ml-auto w-fit max-w-2xl rounded-2xl")}
                        key={message.id}
                    >
                        {message.completed
                            ? message.parts.map((part, index) => {
                                if (part.type === "text") {
                                    if (!part.text) {
                                        return (
                                            <MessageLoading className={cn(message.role == "user" ? "text-muted-foreground" : "text-foreground")} key={index} />
                                        );
                                    }

                                    return (
                                        <p key={index}>
                                            {(part.text || "...")
                                                ?.trim()
                                                .split(" ")
                                                .map((word, wordIndex) => (
                                                    <span className="animate-in fade-in duration-3000" key={wordIndex}>
                                                        {word}
                                                        {" "}
                                                    </span>
                                                ))}
                                        </p>
                                    );
                                }

                                if (part.type === "tool-invocation") {
                                    return (
                                        <ToolMessagePart
                                            isLast={part.toolInvocation.state != "result"}
                                            key={index}
                                            messageId={message.id}
                                            part={part}
                                            showActions={false}
                                        />
                                    );
                                }

                                return (
                                    <p key={index}>
                                        {part.type}
                                        {" "}
                                        unknown part
                                    </p>
                                );
                            })
                            : (
                                <MessageLoading className={cn(message.role == "user" ? "text-muted-foreground" : "text-foreground")} />
                            )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const CompactMessageView = ({ messages }: { messages: UIMessageWithCompleted[] }) => {
    const { textPart, toolParts } = useMemo(() => {
        const toolParts = messages
            .filter((message) => message.parts.some((part) => part.type === "tool-invocation"))
            .map((message) => message.parts.find((part) => part.type === "tool-invocation") as ToolInvocationUIPart);

        const textPart = messages.findLast((message) => message.role === "assistant")?.parts[0] as TextPart;

        return { textPart, toolParts };
    }, [messages]);

    return (
        <div className="relative h-full w-full overflow-hidden">
            <div className="absolute bottom-6 left-6 z-10 hidden max-h-[80vh] flex-col gap-2 overflow-y-auto md:flex">
                {toolParts.map((toolPart, index) => {
                    const isExecuting = toolPart.toolInvocation.state !== "result";

                    if (!toolPart)
                        return null;

                    return (
                        <Dialog key={index}>
                            <DialogTrigger asChild>
                                <div className="animate-in slide-in-from-bottom-2 fade-in w-full max-w-xs duration-3000">
                                    <Button className="bg-card text-muted-foreground flex w-full items-center gap-2 px-2 text-xs" size="icon" variant="outline">
                                        <WrenchIcon className="size-3.5" />
                                        <span className="mr-auto min-w-0 truncate text-sm font-bold">{toolPart.toolInvocation.toolName}</span>
                                        {isExecuting ? <Loader className="size-3.5 animate-spin" /> : <ChevronRight className="size-3.5" />}
                                    </Button>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="z-50 max-h-[80vh] overflow-y-auto p-8 md:max-w-2xl!">
                                <DialogTitle>{toolPart.toolInvocation.toolName}</DialogTitle>
                                <div className="flex flex-row gap-4 text-sm">
                                    <div className="flex w-1/2 min-w-0 flex-col">
                                        <div className="z-10 mb-2 flex items-center gap-2 pt-2 pb-1">
                                            <h5 className="text-muted-foreground text-sm font-medium">Inputs</h5>
                                        </div>
                                        <JsonView data={toolPart.toolInvocation.args} />
                                    </div>

                                    <div className="flex w-1/2 min-w-0 flex-col pl-4">
                                        <div className="z-10 mb-4 flex items-center gap-2 pt-2 pb-1">
                                            <h5 className="text-muted-foreground text-sm font-medium">Outputs</h5>
                                        </div>
                                        <JsonView data={toolPart.toolInvocation.state === "result" ? toolPart.toolInvocation.result : {}} />
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    );
                })}
            </div>

            {/* Current Message - Prominent */}
            {textPart && (
                <div className="mx-auto flex h-full max-h-[80vh] w-full flex-1 items-center overflow-y-auto px-4 lg:max-w-4xl">
                    <div className="animate-in fade-in-50 duration-1000">
                        <p className="text-2xl leading-tight font-semibold tracking-wide md:text-3xl lg:text-4xl">
                            {textPart.text?.split(" ").map((word, wordIndex) => (
                                <span className="animate-in fade-in duration-5000" key={wordIndex}>
                                    {word}
                                    {" "}
                                </span>
                            ))}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
