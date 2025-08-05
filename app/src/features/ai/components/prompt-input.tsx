"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { Avatar, AvatarFallback, AvatarImage } from "@anole/ui/components/avatar";
import { Button } from "@anole/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import ClaudeIcon from "@anole/ui/icons/claude";
import GeminiIcon from "@anole/ui/icons/gemini";
import GrokIcon from "@anole/ui/icons/grok";
import MCPIcon from "@anole/ui/icons/mcp";
import OpenAIIcon from "@anole/ui/icons/openai";
import { useLingui } from "@lingui/react/macro";
import type { Editor } from "@tiptap/react";
import equal from "fast-deep-equal";
import { AudioWaveformIcon, ChevronDown, CornerRightUp, Paperclip, Square, XIcon } from "lucide-react";
import { lazy, Suspense, useCallback, useMemo, useRef } from "react";
import { useShallow } from "zustand/shallow";

import type { ChatMention, ChatModel } from "@/types/chat";
import type { WorkflowSummary } from "@/types/workflow";

import { appStore } from "../store";
import { DefaultToolIcon } from "./default-tool-icon";
import { SelectModel } from "./select-model";
import ToolModeDropdown from "./tool-mode-dropdown";
import { ToolSelectDropdown } from "./tool-select-dropdown";
import type { DefaultToolName } from "../lib/tools";

interface PromptInputProperties {
    append: UseChatHelpers["append"];
    input: string;
    isLoading?: boolean;
    model?: ChatModel;
    onStop: () => void;
    placeholder?: string;
    setInput: (value: string) => void;
    setModel?: (model: ChatModel) => void;
    threadId?: string;
    toolDisabled?: boolean;
    voiceDisabled?: boolean;
}

const ChatMentionInput = lazy(() => import("./chat/chat-mention-input"));

const PromptInput = ({
    append,
    input,
    isLoading,
    model,
    onStop,
    placeholder,
    setInput,
    setModel,
    threadId,
    toolDisabled,
    voiceDisabled,
}: PromptInputProperties) => {
    const { t } = useLingui();
    const [currentThreadId, currentProjectId, globalModel, threadMentions, appStoreMutate] = appStore(
        useShallow((state) => [state.currentThreadId, state.currentProjectId, state.chatModel, state.threadMentions, state.mutate]),
    );

    const mentions = useMemo<ChatMention[]>(() => {
        if (!threadId)
            return [];

        return threadMentions[threadId!] ?? [];
    }, [threadMentions, threadId]);

    const chatModel = useMemo(() => model ?? globalModel, [model, globalModel]);

    const editorReference = useRef<Editor | null>(null);

    const setChatModel = useCallback(
        (model: ChatModel) => {
            if (setModel) {
                setModel(model);
            } else {
                appStoreMutate({ chatModel: model });
            }
        },
        [setModel, appStoreMutate],
    );

    const deleteMention = useCallback(
        (mention: ChatMention) => {
            if (!threadId)
                return;

            appStoreMutate((previous) => {
                const newMentions = mentions.filter((m) => !equal(m, mention));

                return {
                    threadMentions: {
                        ...previous.threadMentions,
                        [threadId!]: newMentions,
                    },
                };
            });
        },
        [mentions, threadId],
    );

    const addMention = useCallback(
        (mention: ChatMention) => {
            if (!threadId)
                return;

            appStoreMutate((previous) => {
                if (mentions.some((m) => equal(m, mention)))
                    return previous;

                const newMentions = [...mentions, mention];

                return {
                    threadMentions: {
                        ...previous.threadMentions,
                        [threadId!]: newMentions,
                    },
                };
            });
        },
        [mentions, threadId],
    );

    const onSelectWorkflow = useCallback(
        (workflow: WorkflowSummary) => {
            addMention({
                description: workflow.description,
                icon: workflow.icon,
                name: workflow.name,
                type: "workflow",
                workflowId: workflow.id,
            });
        },
        [addMention],
    );

    const onChangeMention = useCallback(
        (mentions: ChatMention[]) => {
            mentions.forEach(addMention);
        },
        [addMention],
    );

    const submit = () => {
        if (isLoading)
            return;

        const userMessage = input?.trim() || "";

        if (userMessage.length === 0)
            return;

        setInput("");
        append!({
            content: "",
            parts: [
                {
                    text: userMessage,
                    type: "text",
                },
            ],
            role: "user",
        });
    };

    return (
        <div className="fade-in animate-in mx-auto max-w-3xl">
            <div className="relative z-10 mx-auto w-full max-w-3xl">
                <fieldset className="flex w-full max-w-full min-w-0 flex-col px-4">
                    <div className="ring-muted/60 bg-muted/60 focus-within:bg-muted hover:bg-muted focus-within:ring-muted hover:ring-muted relative z-10 flex w-full cursor-text flex-col items-stretch overflow-hidden rounded-4xl ring-8 backdrop-blur-sm transition-all duration-200">
                        {mentions.length > 0 && (
                            <div className="bg-input flex flex-col gap-4 rounded-t-3xl rounded-b-sm p-3">
                                {mentions.map((mention, index) => (
                                    <div className="flex items-center gap-2" key={index}>
                                        {mention.type === "workflow"
                                            ? (
                                                <Avatar className="ring-border size-6 flex-shrink-0 rounded-full p-1 ring" style={mention.icon?.style}>
                                                    <AvatarImage src={mention.icon?.value} />
                                                    <AvatarFallback>{mention.name.slice(0, 1)}</AvatarFallback>
                                                </Avatar>
                                            )
                                            : (
                                                <Button className="ring-border flex size-6 flex-shrink-0 items-center justify-center rounded-full p-0.5 ring">
                                                    {mention.type === "mcpServer"
                                                        ? (
                                                            <MCPIcon className="size-3.5" />
                                                        )
                                                        : (
                                                            <DefaultToolIcon className="size-3.5" name={mention.name as DefaultToolName} />
                                                        )}
                                                </Button>
                                            )}

                                        <div className="flex min-w-0 flex-1 flex-col">
                                            <span className="truncate text-sm font-semibold">{mention.name}</span>
                                            {mention.description ? <span className="text-muted-foreground truncate text-xs">{mention.description}</span> : null}
                                        </div>
                                        <Button
                                            className="hover:bg-input! flex-shrink-0 rounded-full"
                                            disabled={!threadId}
                                            onClick={() => {
                                                deleteMention(mention);
                                            }}
                                            size="icon"
                                            variant="ghost"
                                        >
                                            <XIcon />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex flex-col gap-3.5 px-3 py-2">
                            <div className="relative min-h-[2rem]">
                                <Suspense fallback={<div className="h-[2rem] w-full animate-pulse" />}>
                                    <ChatMentionInput
                                        input={input}
                                        onChange={setInput}
                                        onChangeMention={onChangeMention}
                                        onEnter={submit}
                                        placeholder={placeholder ?? t`Ask anything or @mention`}
                                        ref={editorReference}
                                    />
                                </Suspense>
                            </div>
                            <div className="z-30 flex w-full items-center gap-[2px]">
                                <Button
                                    className="hover:bg-input! rounded-full p-2!"
                                    onClick={() => console.log("TODO: missing feature")}
                                    size="sm"
                                    variant="ghost"
                                >
                                    <Paperclip />
                                </Button>

                                {!toolDisabled && (
                                    <>
                                        <ToolModeDropdown />
                                        <ToolSelectDropdown align="start" className="ml-1" mentions={mentions} onSelectWorkflow={onSelectWorkflow} side="top" />
                                    </>
                                )}
                                <div className="flex-1" />

                                <SelectModel defaultModel={chatModel} onSelect={setChatModel}>
                                    <Button className="group data-[state=open]:bg-input! hover:bg-input! mr-1 rounded-full" size="sm" variant="ghost">
                                        {chatModel?.model
                                            ? (
                                                <>
                                                    {chatModel.provider === "openai"
                                                        ? (
                                                            <OpenAIIcon className="size-3 opacity-0 group-hover:opacity-100 group-data-[state=open]:opacity-100" />
                                                        )
                                                        : chatModel.provider === "xai"
                                                            ? (
                                                                <GrokIcon className="size-3 opacity-0 group-hover:opacity-100 group-data-[state=open]:opacity-100" />
                                                            )
                                                            : chatModel.provider === "anthropic"
                                                                ? (
                                                                    <ClaudeIcon className="size-3 opacity-0 group-hover:opacity-100 group-data-[state=open]:opacity-100" />
                                                                )
                                                                : chatModel.provider === "google"
                                                                    ? (
                                                                        <GeminiIcon className="size-3 opacity-0 group-hover:opacity-100 group-data-[state=open]:opacity-100" />
                                                                    )
                                                                    : null}
                                                    <span className="text-muted-foreground group-data-[state=open]:text-foreground group-hover:text-foreground">
                                                        {chatModel.model}
                                                    </span>
                                                </>
                                            )
                                            : (
                                                <span className="text-muted-foreground">model</span>
                                            )}

                                        <ChevronDown className="size-3" />
                                    </Button>
                                </SelectModel>
                                {!isLoading && input?.length === 0 && !voiceDisabled
                                    ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    className="rounded-full p-2!"
                                                    onClick={() => {
                                                        appStoreMutate((state) => {
                                                            return {
                                                                voiceChat: {
                                                                    ...state.voiceChat,
                                                                    isOpen: true,
                                                                    projectId: currentProjectId ?? undefined,
                                                                    threadId: currentThreadId ?? undefined,
                                                                },
                                                            };
                                                        });
                                                    }}
                                                    size="sm"
                                                >
                                                    <AudioWaveformIcon size={16} />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t`Voice Chat Mode`}</TooltipContent>
                                        </Tooltip>
                                    )
                                    : (
                                        <div
                                            className="fade-in animate-in text-muted-foreground bg-secondary hover:bg-accent-foreground hover:text-accent cursor-pointer rounded-full p-2 transition-all duration-200"
                                            onClick={() => {
                                                if (isLoading) {
                                                    onStop();
                                                } else {
                                                    submit();
                                                }
                                            }}
                                        >
                                            {isLoading ? <Square className="fill-muted-foreground text-muted-foreground" size={16} /> : <CornerRightUp size={16} />}
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </fieldset>
            </div>
        </div>
    );
}

export default PromptInput;
