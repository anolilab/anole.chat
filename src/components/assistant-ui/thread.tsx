import { ActionBarPrimitive, BranchPickerPrimitive, ComposerPrimitive, ErrorPrimitive, MessagePrimitive, ThreadPrimitive } from "@assistant-ui/react";
import type { FC } from "react";
import { useState, useCallback } from "react";
import {
    ArrowDownIcon,
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CopyIcon,
    PencilIcon,
    RefreshCwIcon,
    SendHorizontalIcon,
    ThumbsDownIcon,
    ThumbsUpIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import { ScrollBar } from "@/components/ui/scroll-area";
import { ComposerAttachments, ComposerAddAttachment } from "@/components/assistant-ui/attachment";
import { UserMessageAttachments } from "@/components/assistant-ui/attachment";
import { Button } from "@/components/ui/button";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { useLingui } from "@lingui/react/macro";
import { PromptImprovement } from "@/components/assistant-ui/prompt-improvement";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { agents, type AgentModel } from "@cvx/ai/lib/agents";
import { useAiModelContext } from "@/features/chat/providers/ai-model-provider";

export const Thread: FC<{ threadId?: string }> = ({ threadId }) => {
    return (
        <ScrollAreaPrimitive.Root asChild>
            <ThreadPrimitive.Root
                className="box-border flex h-full flex-col overflow-hidden"
                style={{
                    ["--thread-max-width" as string]: "42rem",
                }}
            >
                <ScrollAreaPrimitive.Viewport className="thread-viewport h-full" asChild>
                    <ThreadPrimitive.Viewport className="flex h-full flex-col items-center overflow-y-scroll scroll-smooth bg-inherit px-4 pt-8">
                        <ThreadWelcome />

                        <ThreadPrimitive.Messages
                            components={{
                                UserMessage: UserMessage,
                                EditComposer: EditComposer,
                                AssistantMessage: AssistantMessage,
                            }}
                        />

                        <ThreadPrimitive.If empty={false}>
                            <div className="min-h-8 flex-grow" />
                        </ThreadPrimitive.If>

                        <div className="sticky bottom-0 flex w-full max-w-[var(--thread-max-width)] flex-col items-center justify-end rounded-t-lg bg-inherit">
                            <ThreadScrollToBottom />
                            <Composer threadId={threadId} />
                        </div>
                    </ThreadPrimitive.Viewport>
                </ScrollAreaPrimitive.Viewport>
                <ScrollBar />
            </ThreadPrimitive.Root>
        </ScrollAreaPrimitive.Root>
    );
};

const ThreadScrollToBottom: FC = () => {
    return (
        <ThreadPrimitive.ScrollToBottom asChild>
            <TooltipIconButton tooltip="Scroll to bottom" variant="outline" className="absolute -top-8 rounded-full disabled:invisible">
                <ArrowDownIcon />
            </TooltipIconButton>
        </ThreadPrimitive.ScrollToBottom>
    );
};

const ThreadWelcome: FC = () => {
    return (
        <ThreadPrimitive.Empty>
            <div className="flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col">
                <div className="flex w-full flex-grow flex-col items-center justify-center">
                    <p className="mt-4 font-medium">How can I help you today?</p>
                </div>
                <ThreadWelcomeSuggestions />
            </div>
        </ThreadPrimitive.Empty>
    );
};

const ThreadWelcomeSuggestions: FC = () => {
    return (
        <div className="mt-3 flex w-full items-stretch justify-center gap-4">
            <ThreadPrimitive.Suggestion
                className="hover:bg-muted/80 flex max-w-sm grow basis-0 flex-col items-center justify-center rounded-lg border p-3"
                prompt="What is the weather in Tokyo?"
                method="replace"
                autoSend
            >
                <span className="line-clamp-2 text-sm font-semibold text-ellipsis">What is the weather in Tokyo?</span>
            </ThreadPrimitive.Suggestion>
            <ThreadPrimitive.Suggestion
                className="hover:bg-muted/80 flex max-w-sm grow basis-0 flex-col items-center justify-center rounded-lg border p-3"
                prompt="What is assistant-ui?"
                method="replace"
                autoSend
            >
                <span className="line-clamp-2 text-sm font-semibold text-ellipsis">What is assistant-ui?</span>
            </ThreadPrimitive.Suggestion>
        </div>
    );
};

const Composer: FC<{ threadId?: string }> = ({ threadId }) => {
    const { t } = useLingui();
    const { selectedModel, setSelectedModel } = useAiModelContext();
    const [inputValue, setInputValue] = useState("");

    return (
        <>
            <div className="w-full rounded-lg bg-neutral-200/80 p-1 backdrop-blur-lg">
                <div className="flex flex-row items-center justify-between">
                    <ComposerAddAttachment />
                    <ComposerAttachments />
                </div>
                <ComposerPrimitive.Root className="focus-within:border-ring/20 flex w-full flex-col items-start rounded-lg border bg-white/60 px-2.5 shadow-sm backdrop-blur-lg">
                    <div className="flex w-full flex-row items-center justify-between">
                        <ComposerPrimitive.Input
                            data-composer-input
                            rows={1}
                            autoFocus
                            placeholder={t`Type your message here...`}
                            className="placeholder:text-muted-foreground max-h-40 w-full flex-grow resize-none border-none bg-transparent px-2 py-4 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed"
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                setInputValue(e.target.value);
                            }}
                            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    setInputValue("");
                                }
                            }}
                        />
                        {threadId && <PromptImprovement key={threadId} threadId={threadId} currentInputValue={inputValue?.trim()} />}
                    </div>
                    <div className="flex w-full flex-row items-center justify-between">
                        <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as AgentModel)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(agents).map((model) => (
                                    <SelectItem key={model} value={model}>
                                        {model}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="grow" />
                        <ComposerAction />
                    </div>
                </ComposerPrimitive.Root>
            </div>
            <div id="composer-placeholder" className="-mt-2 h-4 w-full lg:bg-white dark:lg:bg-zinc-900" />
        </>
    );
};

const ComposerAction: FC = () => {
    return (
        <>
            <ThreadPrimitive.If running={false}>
                <ComposerPrimitive.Send asChild>
                    <TooltipIconButton tooltip="Send" variant="default" className="my-2.5 size-8 p-2 transition-opacity ease-in">
                        <SendHorizontalIcon />
                    </TooltipIconButton>
                </ComposerPrimitive.Send>
            </ThreadPrimitive.If>
            <ThreadPrimitive.If running>
                <ComposerPrimitive.Cancel asChild>
                    <TooltipIconButton tooltip="Cancel" variant="default" className="my-2.5 size-8 p-2 transition-opacity ease-in">
                        <CircleStopIcon />
                    </TooltipIconButton>
                </ComposerPrimitive.Cancel>
            </ThreadPrimitive.If>
        </>
    );
};

const UserMessage: FC = () => {
    return (
        <MessagePrimitive.Root className="grid w-full max-w-[var(--thread-max-width)] auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 py-4 [&:where(>*)]:col-start-2">
            <UserActionBar />
            <UserMessageAttachments />
            <div className="bg-muted text-foreground col-start-2 row-start-2 max-w-[var(--thread-max-width)] rounded-3xl px-5 py-2.5 break-words">
                <MessagePrimitive.Content components={{ Text: MarkdownText }} />
            </div>

            <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
        </MessagePrimitive.Root>
    );
};

const UserActionBar: FC = () => {
    return (
        <ActionBarPrimitive.Root hideWhenRunning autohide="not-last" className="col-start-1 row-start-2 mt-2.5 mr-3 flex flex-col items-end">
            <ActionBarPrimitive.Edit asChild>
                <TooltipIconButton tooltip="Edit">
                    <PencilIcon />
                </TooltipIconButton>
            </ActionBarPrimitive.Edit>
            <ActionBarPrimitive.Copy asChild>
                <TooltipIconButton tooltip="Copy">
                    <CopyIcon />
                </TooltipIconButton>
            </ActionBarPrimitive.Copy>
        </ActionBarPrimitive.Root>
    );
};

const EditComposer: FC = () => {
    return (
        <ComposerPrimitive.Root className="bg-muted my-4 flex w-full max-w-[var(--thread-max-width)] flex-col gap-2">
            <ComposerPrimitive.Input className="text-foreground flex h-8 w-full resize-none bg-transparent p-4 pb-0 outline-none" />

            <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
                <ComposerPrimitive.Cancel asChild>
                    <Button variant="ghost">Cancel</Button>
                </ComposerPrimitive.Cancel>
                <ComposerPrimitive.Send asChild>
                    <Button>Send</Button>
                </ComposerPrimitive.Send>
            </div>
        </ComposerPrimitive.Root>
    );
};

const AssistantMessage: FC = () => {
    return (
        <MessagePrimitive.Root className="relative grid w-full max-w-[var(--thread-max-width)] grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] py-4">
            <div className="text-foreground col-span-2 col-start-2 row-start-1 my-1.5 max-w-[var(--thread-max-width)] leading-7 break-words dark:text-white">
                <MessagePrimitive.Content components={{ Text: MarkdownText }} />
                <MessageError />
            </div>

            <AssistantActionBar />

            <BranchPicker className="col-start-2 row-start-2 mr-2 -ml-2" />
        </MessagePrimitive.Root>
    );
};

const MessageError: FC = () => {
    return (
        <MessagePrimitive.Error>
            <ErrorPrimitive.Root className="border-destructive bg-destructive/10 dark:bg-destructive/5 text-destructive mt-2 rounded-md border p-3 text-sm dark:text-red-200">
                <ErrorPrimitive.Message className="line-clamp-2" />
            </ErrorPrimitive.Root>
        </MessagePrimitive.Error>
    );
};

const AssistantActionBar: FC = () => {
    return (
        <ActionBarPrimitive.Root
            hideWhenRunning
            autohide="not-last"
            autohideFloat="single-branch"
            className="text-muted-foreground data-[floating]:bg-background col-start-3 row-start-2 -ml-1 flex gap-1 data-[floating]:absolute data-[floating]:rounded-md data-[floating]:border data-[floating]:p-1 data-[floating]:shadow-sm"
        >
            <ActionBarPrimitive.Copy asChild>
                <TooltipIconButton tooltip="Copy">
                    <MessagePrimitive.If copied>
                        <CheckIcon />
                    </MessagePrimitive.If>
                    <MessagePrimitive.If copied={false}>
                        <CopyIcon />
                    </MessagePrimitive.If>
                </TooltipIconButton>
            </ActionBarPrimitive.Copy>
            <ActionBarPrimitive.Reload asChild>
                <TooltipIconButton tooltip="Refresh">
                    <RefreshCwIcon />
                </TooltipIconButton>
            </ActionBarPrimitive.Reload>
            {/* TODO: Improve the message feedback
            <ActionBarPrimitive.FeedbackPositive asChild>
                <TooltipIconButton tooltip="Positive Feedback">
                    <ThumbsUpIcon />
                </TooltipIconButton>
            </ActionBarPrimitive.FeedbackPositive>
            <ActionBarPrimitive.FeedbackNegative asChild>
                <TooltipIconButton tooltip="Negative Feedback">
                    <ThumbsDownIcon />
                </TooltipIconButton>
            </ActionBarPrimitive.FeedbackNegative>
             */}
        </ActionBarPrimitive.Root>
    );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({ className, ...rest }) => {
    return (
        <BranchPickerPrimitive.Root hideWhenSingleBranch className={cn("text-muted-foreground inline-flex items-center text-xs", className)} {...rest}>
            <BranchPickerPrimitive.Previous asChild>
                <TooltipIconButton tooltip="Previous">
                    <ChevronLeftIcon />
                </TooltipIconButton>
            </BranchPickerPrimitive.Previous>
            <span className="font-medium">
                <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
            </span>
            <BranchPickerPrimitive.Next asChild>
                <TooltipIconButton tooltip="Next">
                    <ChevronRightIcon />
                </TooltipIconButton>
            </BranchPickerPrimitive.Next>
        </BranchPickerPrimitive.Root>
    );
};

const CircleStopIcon = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
            <rect width="10" height="10" x="3" y="3" rx="2" />
        </svg>
    );
};
