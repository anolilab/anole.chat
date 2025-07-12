import type { AgentModel } from "@anole/convex/ai/lib/agents";
import { agents } from "@anole/convex/ai/lib/agents";
import { ActionBarPrimitive, BranchPickerPrimitive, ComposerPrimitive, ErrorPrimitive, MessagePrimitive, ThreadPrimitive } from "@assistant-ui/react";
import { useLingui } from "@lingui/react/macro";
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
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import type { FC } from "react";
import { useCallback, useState } from "react";

import { ComposerAddAttachment, ComposerAttachments, UserMessageAttachments } from "@/components/assistant-ui/attachment";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { PromptImprovement } from "@/components/assistant-ui/prompt-improvement";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { ScrollBar } from "@/components/ui/scroll-area";
import { useSession } from "@/features/auth/hooks/session-user-management";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { useAiModelContext } from "@/features/chat/providers/ai-model-provider";
import { cn } from "@/lib/utils";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export const Thread: FC<{ threadId?: string }> = ({ threadId }) => (
    <ScrollAreaPrimitive.Root asChild>
        <ThreadPrimitive.Root
            className="box-border flex h-full flex-col overflow-hidden"
            style={{
                ["--thread-max-width" as string]: "42rem",
            }}
        >
            <ScrollAreaPrimitive.Viewport asChild className="thread-viewport h-full">
                <ThreadPrimitive.Viewport className="flex h-full flex-col items-center overflow-y-scroll scroll-smooth bg-inherit px-4 pt-8">
                    <ThreadWelcome />

                    <ThreadPrimitive.Messages
                        components={{
                            AssistantMessage,
                            EditComposer,
                            UserMessage,
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

const ThreadScrollToBottom: FC = () => (
    <ThreadPrimitive.ScrollToBottom asChild>
        <TooltipIconButton className="absolute -top-8 rounded-full disabled:invisible" tooltip="Scroll to bottom" variant="outline">
            <ArrowDownIcon />
        </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
);

const ThreadWelcome: FC = () => {
    const { t } = useLingui();
    const { hooks } = useAuth();
    const { data: sessionData } = hooks.useSession();

    const getWelcomeMessage = () => {
        if (sessionData?.user?.name) {
            return t`Hello ${sessionData.user.name}! What would you like to do today?`;
        }

        return t`How can I help you today?`;
    };

    return (
        <ThreadPrimitive.Empty>
            <div className="flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col">
                <div className="flex w-full flex-grow flex-col items-center justify-center">
                    <p className="mt-4 font-medium">{getWelcomeMessage()}</p>
                </div>
                {/* <ThreadWelcomeSuggestions /> */}
            </div>
        </ThreadPrimitive.Empty>
    );
};

const ThreadWelcomeSuggestions: FC = () => {
    const { t } = useLingui();

    const suggestions = [
        {
            category: t`Creativity`,
            icon: "💡",
            prompt: t`Generate creative ideas for my project`,
        },
    ];

    return (
        <div className="mb-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((suggestion, index) => (
                <ThreadPrimitive.Suggestion
                    autoSend
                    className="border-border/50 from-background/80 to-muted/30 hover:border-border hover:shadow-primary/10 group relative flex flex-col items-start justify-between rounded-xl border bg-gradient-to-br p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                    key={index}
                    method="replace"
                    prompt={suggestion.prompt}
                >
                    <div className="mb-2 flex items-center gap-2">
                        <span className="text-lg">{suggestion.icon}</span>
                        <span className="text-muted-foreground bg-muted/50 rounded-full px-2 py-1 text-xs font-medium">{suggestion.category}</span>
                    </div>
                    <span className="text-foreground group-hover:text-primary text-sm font-medium leading-relaxed transition-colors">{suggestion.prompt}</span>
                    <div className="from-primary/5 to-secondary/5 absolute inset-0 rounded-xl bg-gradient-to-r opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                </ThreadPrimitive.Suggestion>
            ))}
        </div>
    );
};

const Composer: FC<{ threadId?: string }> = ({ threadId }) => {
    const { t } = useLingui();
    const { selectedModel, setSelectedModel } = useAiModelContext();

    return (
        <>
            <div className="w-full rounded-lg bg-neutral-200/80 p-1 backdrop-blur-lg dark:bg-neutral-800/80">
                <div className="flex flex-row items-center justify-between">
                    <ComposerAddAttachment />
                    <ComposerAttachments />
                </div>
                <ComposerPrimitive.Root className="focus-within:border-ring/20 flex w-full flex-col items-start rounded-lg border bg-white/60 px-2.5 shadow-sm backdrop-blur-lg dark:border-neutral-700 dark:bg-neutral-900/60">
                    <div className="flex w-full flex-row items-center justify-between">
                        <ComposerPrimitive.Input
                            autoFocus
                            className="placeholder:text-muted-foreground min-h-10 w-full flex-grow resize-none border-none bg-transparent px-2 py-4 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed dark:text-neutral-100 dark:placeholder:text-neutral-400"
                            data-composer-input
                            placeholder={t`Type your message here...`}
                            rows={1}
                        />
                        {threadId && <PromptImprovement key={threadId} threadId={threadId} />}
                    </div>
                    <div className="flex w-full flex-row items-center justify-between">
                        <Select
                            onValueChange={(v) => {
                                setSelectedModel(v as AgentModel);
                            }}
                            value={selectedModel}
                        >
                            <SelectTrigger className="dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100">
                                <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent className="dark:border-neutral-600 dark:bg-neutral-800">
                                {Object.keys(agents).map((model) => (
                                    <SelectItem className="dark:text-neutral-100 dark:focus:bg-neutral-700" key={model} value={model}>
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
            <div className="-mt-2 h-4 w-full lg:bg-white dark:lg:bg-neutral-900" id="composer-placeholder" />
        </>
    );
};

const ComposerAction: FC = () => (
    <>
        <ThreadPrimitive.If running={false}>
            <ComposerPrimitive.Send asChild>
                <TooltipIconButton className="my-2.5 size-8 p-2 transition-opacity ease-in" tooltip="Send" variant="default">
                    <SendHorizontalIcon />
                </TooltipIconButton>
            </ComposerPrimitive.Send>
        </ThreadPrimitive.If>
        <ThreadPrimitive.If running>
            <ComposerPrimitive.Cancel asChild>
                <TooltipIconButton className="my-2.5 size-8 p-2 transition-opacity ease-in" tooltip="Cancel" variant="default">
                    <CircleStopIcon />
                </TooltipIconButton>
            </ComposerPrimitive.Cancel>
        </ThreadPrimitive.If>
    </>
);

const UserMessage: FC = () => (
    <MessagePrimitive.Root className="grid w-full max-w-[var(--thread-max-width)] auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 py-4 [&:where(>*)]:col-start-2">
        <UserMessageAttachments />
        <div className="bg-muted text-foreground col-start-2 row-start-2 max-w-[var(--thread-max-width)] break-words rounded-3xl px-5 py-2.5">
            <MessagePrimitive.Content components={{ Text: MarkdownText }} />
        </div>
        <UserActionBar />

        <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
    </MessagePrimitive.Root>
);

const UserActionBar: FC = () => (
    <ActionBarPrimitive.Root autohide="not-last" className="mr-3 flex flex-col items-end" hideWhenRunning>
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

const EditComposer: FC = () => (
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

const AssistantMessage: FC = () => (
    <MessagePrimitive.Root className="relative grid w-full max-w-[var(--thread-max-width)] grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] py-4">
        <div className="text-foreground col-span-2 col-start-2 row-start-1 my-1.5 max-w-[var(--thread-max-width)] break-words leading-7 dark:text-white">
            <MessagePrimitive.Content components={{ Text: MarkdownText }} />
            <MessageError />
        </div>

        <AssistantActionBar />

        <BranchPicker className="col-start-2 row-start-2 -ml-2 mr-2" />
    </MessagePrimitive.Root>
);

const MessageError: FC = () => (
    <MessagePrimitive.Error>
        <ErrorPrimitive.Root className="border-destructive bg-destructive/10 dark:bg-destructive/5 text-destructive mt-2 rounded-md border p-3 text-sm dark:text-red-200">
            <ErrorPrimitive.Message className="line-clamp-2" />
        </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
);

const AssistantActionBar: FC = () => (
    <ActionBarPrimitive.Root
        autohide="not-last"
        autohideFloat="single-branch"
        className="text-muted-foreground data-[floating]:bg-background col-start-3 row-start-2 -ml-1 flex gap-1 data-[floating]:absolute data-[floating]:rounded-md data-[floating]:border data-[floating]:p-1 data-[floating]:shadow-sm"
        hideWhenRunning
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

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({ className, ...rest }) => (
    <BranchPickerPrimitive.Root className={cn("text-muted-foreground inline-flex items-center text-xs", className)} hideWhenSingleBranch {...rest}>
        <BranchPickerPrimitive.Previous asChild>
            <TooltipIconButton tooltip="Previous">
                <ChevronLeftIcon />
            </TooltipIconButton>
        </BranchPickerPrimitive.Previous>
        <span className="font-medium">
            <BranchPickerPrimitive.Number />
            {" "}
            /
            <BranchPickerPrimitive.Count />
        </span>
        <BranchPickerPrimitive.Next asChild>
            <TooltipIconButton tooltip="Next">
                <ChevronRightIcon />
            </TooltipIconButton>
        </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
);

const CircleStopIcon = () => (
    <svg fill="currentColor" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
        <rect height="10" rx="2" width="10" x="3" y="3" />
    </svg>
);
