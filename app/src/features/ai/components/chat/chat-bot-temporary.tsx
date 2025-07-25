"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@anole/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@anole/ui/components/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@anole/ui/components/drawer";
import { Separator } from "@anole/ui/components/separator";
import { Textarea } from "@anole/ui/components/textarea";
import Think from "@anole/ui/icons/think";
import { useLingui } from "@lingui/react/macro";
import type { UIMessage } from "ai";
import { isShortcutEvent, Shortcuts } from "lib/keyboard-shortcuts";
import { Settings2, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";

import { appStore } from "../../store";
import PromptInput from "../prompt-input";
import { ErrorMessage, PreviewMessage } from "./message";

export const ChatBotTemporary = () => {
    const { t } = useLingui();
    const [temporaryChat, appStoreMutate] = appStore(useShallow((state) => [state.temporaryChat, state.mutate]));
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

    const setOpen = (bool: boolean) => {
        appStoreMutate({
            temporaryChat: {
                ...temporaryChat,
                isOpen: bool,
            },
        });
    };

    const { append, error, input, messages, reload, setInput, setMessages, status, stop } = useChat({
        api: "/api/chat/temporary",
        body: {
            chatModel: temporaryChat.chatModel,
            instructions: temporaryChat.instructions,
        },
        experimental_throttle: 100,
        onError: () => {
            setMessages((previous) => previous.slice(0, -1));
        },
    });

    const isLoading = useMemo(() => status === "streaming" || status === "submitted", [status]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isShortcutEvent(e, Shortcuts.toggleTemporaryChat)) {
                e.preventDefault();
                e.stopPropagation();
                appStoreMutate((previous) => {
                    return {
                        temporaryChat: {
                            ...previous.temporaryChat,
                            isOpen: !previous.temporaryChat.isOpen,
                        },
                    };
                });
            } else if (
                temporaryChat.isOpen
                && isShortcutEvent(e, {
                    shortcut: {
                        command: true,
                        key: "e",
                    },
                })
            ) {
                e.preventDefault();
                e.stopPropagation();
                setMessages([]);
            } else if (
                temporaryChat.isOpen
                && isShortcutEvent(e, {
                    shortcut: {
                        command: true,
                        key: "i",
                    },
                })
            ) {
                e.preventDefault();
                e.stopPropagation();
                setIsInstructionsOpen((previous) => !previous);
            }
        };

        globalThis.addEventListener("keydown", handleKeyDown);

        return () => globalThis.removeEventListener("keydown", handleKeyDown);
    }, [temporaryChat.isOpen]);

    return (
        <Drawer direction="right" handleOnly onOpenChange={setOpen} open={temporaryChat.isOpen}>
            <DrawerContent
                className="flex w-full flex-col px-2 md:w-2xl"
                style={{
                    userSelect: "text",
                }}
            >
                <DrawerHeader>
                    <DrawerTitle className="flex items-center gap-2">
                        <p className="hidden sm:flex">{t`Temporary Chat`}</p>

                        <div className="flex-1" />

                        <Button className="rounded-full" disabled={isLoading} onClick={() => setMessages([])} variant="secondary">
                            {t`Reset Chat`}
                            <Separator orientation="vertical" />
                            <span className="text-muted-foreground ml-1 text-xs">⌘E</span>
                        </Button>
                        <TemporaryChatInstructions
                            instructions={temporaryChat.instructions ?? ""}
                            isOpen={isInstructionsOpen}
                            onSave={(instructions) => {
                                appStoreMutate({
                                    temporaryChat: { ...temporaryChat, instructions },
                                });
                            }}
                            setIsOpen={setIsInstructionsOpen}
                        >
                            <Button className="rounded-full" variant="secondary">
                                <Settings2 />
                                <Separator orientation="vertical" />
                                <span className="text-muted-foreground ml-1 text-xs">⌘I</span>
                            </Button>
                        </TemporaryChatInstructions>
                        <DrawerClose asChild>
                            <Button className="flex items-center gap-1 rounded-full" variant="secondary">
                                <X />
                                <Separator orientation="vertical" />
                                <span className="text-muted-foreground ml-1 text-xs">ESC</span>
                            </Button>
                        </DrawerClose>
                    </DrawerTitle>
                </DrawerHeader>
                <DrawerTemporaryContent
                    append={append}
                    error={error}
                    input={input}
                    isLoading={isLoading}
                    messages={messages}
                    reload={reload}
                    setInput={setInput}
                    setMessages={setMessages}
                    status={status}
                    stop={stop}
                />
            </DrawerContent>
        </Drawer>
    );
};

const DrawerTemporaryContent = ({
    append,
    error,
    input,
    isLoading,
    messages,
    reload,
    setInput,
    setMessages,
    status,
    stop,
}: {
    append: UseChatHelpers["append"];
    error: Error | undefined;
    input: string;
    isLoading: boolean;
    messages: UIMessage[];
    reload: UseChatHelpers["reload"];
    setInput: (input: string) => void;
    setMessages: UseChatHelpers["setMessages"];
    status: "submitted" | "streaming" | "ready" | "error";
    stop: UseChatHelpers["stop"];
}) => {
    const containerReference = useRef<HTMLDivElement>(null);
    const { t } = useLingui();
    const autoScrollReference = useRef(false);

    const [temporaryChat, appStoreMutate] = appStore(useShallow((state) => [state.temporaryChat, state.mutate]));

    const showThink = useMemo(() => {
        if (!isLoading)
            return false;

        const lastMessage = messages.at(-1);

        if (lastMessage?.role === "user")
            return true;

        const lastPart = lastMessage?.parts.at(-1);

        if (lastPart?.type === "step-start")
            return true;

        return false;
    }, [isLoading, messages.at(-1)]);

    useEffect(() => {
        containerReference.current?.scrollTo({
            top: containerReference.current?.scrollHeight,
        });
    }, []);

    useEffect(() => {
        if (autoScrollReference.current) {
            containerReference.current?.scrollTo({
                top: containerReference.current?.scrollHeight,
            });
        }
    }, [messages]);

    useEffect(() => {
        if (isLoading) {
            autoScrollReference.current = true;
            const handleScroll = () => {
                const element = containerReference.current!;
                const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 20;

                if (!isAtBottom) {
                    autoScrollReference.current = false;
                }
            };

            containerReference.current?.addEventListener("scroll", handleScroll);

            return () => {
                containerReference.current?.removeEventListener("scroll", handleScroll);
            };
        }
    }, [isLoading]);

    useEffect(() => {
        if (!temporaryChat.chatModel) {
            appStoreMutate((state) => {
                if (!state.chatModel)
                    return state;

                return {
                    temporaryChat: {
                        ...temporaryChat,
                        chatModel: state.chatModel,
                    },
                };
            });
        }
    }, [Boolean(temporaryChat.chatModel)]);

    return (
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-hidden">
            {messages.length === 0 && (
                <div className="flex flex-1 items-center">
                    <div className="mx-auto my-4 max-w-3xl">
                        {" "}
                        <div className="flex flex-col gap-2 rounded-xl p-6 text-center leading-relaxed">
                            <h1 className="text-4xl font-semibold">{t`This chat won't be saved.`}</h1>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col gap-2 overflow-y-auto py-6" ref={containerReference}>
                {messages.map((message, index) => {
                    const isLastMessage = messages.length - 1 === index;

                    return (
                        <PreviewMessage
                            isLastMessage={isLastMessage}
                            isLoading={isLoading}
                            key={index}
                            message={message}
                            messageIndex={index}
                            reload={reload}
                            setMessages={setMessages}
                            status={status}
                        />
                    );
                })}
                {showThink && (
                    <div className="mx-auto w-full max-w-3xl px-6">
                        <Think />
                    </div>
                )}
                {error && <ErrorMessage error={error} />}
            </div>

            <div className="my-6 mt-auto w-full">
                <PromptInput
                    append={append}
                    input={input}
                    isLoading={isLoading}
                    model={temporaryChat.chatModel}
                    onStop={stop}
                    placeholder={t`Feel free to ask anything temporarily`}
                    setInput={setInput}
                    setModel={(model) => {
                        appStoreMutate({
                            temporaryChat: {
                                ...temporaryChat,
                                chatModel: model,
                            },
                        });
                    }}
                    toolDisabled
                    voiceDisabled
                />
            </div>
        </div>
    );
};

const TemporaryChatInstructions = ({
    children,
    instructions,
    isOpen,
    onSave,
    setIsOpen,
}: {
    children: ReactNode;
    instructions: string;
    isOpen: boolean;
    onSave: (instructions: string) => void;
    setIsOpen: (isOpen: boolean) => void;
}) => {
    const [input, setInput] = useState(instructions);
    const { t } = useLingui();

    useEffect(() => {
        if (isOpen) {
            setInput(instructions);
        }
    }, [isOpen]);

    return (
        <Dialog onOpenChange={setIsOpen} open={isOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t`Chat.TemporaryChat.temporaryChatInstructions`}</DialogTitle>
                    <DialogDescription>{t`Chat.TemporaryChat.temporaryChatInstructionsDescription`}</DialogDescription>
                </DialogHeader>
                <DialogDescription>
                    <Textarea
                        autoFocus
                        className="h-40 resize-none"
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t`Chat.TemporaryChat.temporaryChatInstructionsPlaceholder`}
                        value={input}
                    />
                </DialogDescription>
                <DialogFooter>
                    <Button
                        onClick={() => {
                            onSave(input);
                            setIsOpen(false);
                        }}
                    >
                        {t`Common.save`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
