"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { Alert, AlertDescription, AlertTitle } from "@anole/ui/components/alert";
import { Button } from "@anole/ui/components/button";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import { ChevronDown, ChevronUp, Terminal } from "lucide-react";
import { memo, useMemo, useState } from "react";

import type { ChatMessageAnnotation, ClientToolInvocation } from "@/types/chat";

import { AssistMessagePart, ReasoningPart, ToolMessagePart, UserMessagePart } from "./message-parts";

function truncateString(string_: string, maxLength: number): string {
    if (string_.length <= maxLength)
        return string_;

    return `${string_.slice(0, maxLength)}...`;
}

interface Properties {
    className?: string;
    isError?: boolean;
    isLastMessage: boolean;
    isLoading: boolean;
    message: UIMessage;
    messageIndex: number;
    onProxyToolCall?: (result: ClientToolInvocation) => void;
    reload: UseChatHelpers["reload"];
    setMessages: UseChatHelpers["setMessages"];
    status: UseChatHelpers["status"];
    threadId?: string;
}

const PurePreviewMessage = ({
    className,
    isError,
    isLastMessage,
    isLoading,
    message,
    messageIndex,
    onProxyToolCall,
    reload,
    setMessages,
    status,
    threadId,
}: Properties) => {
    const isUserMessage = useMemo(() => message.role === "user", [message.role]);

    if (message.role === "system") {
        return null; // system message is not shown
    }

    if (message.parts.length === 0) {
        return null;
    }

    return (
        <div className="group/message mx-auto w-full max-w-3xl px-6">
            <div className={cn(className, "flex w-full gap-4 group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl")}>
                <div className="flex w-full flex-col gap-4">
                    {message.experimental_attachments && (
                        <div className="flex flex-row justify-end gap-2" data-testid="message-attachments">
                            {message.experimental_attachments.map((attachment) => (
                                <Alert key={attachment.url}>
                                    <AlertTitle>Attachment</AlertTitle>
                                    <AlertDescription>attachment not yet implemented 😁</AlertDescription>
                                </Alert>
                            ))}
                        </div>
                    )}

                    {message.parts?.map((part, index) => {
                        const key = `message-${messageIndex}-part-${part.type}-${index}`;
                        const isLastPart = index === message.parts.length - 1;

                        if (part.type === "reasoning") {
                            return <ReasoningPart isThinking={isLastPart && isLastMessage && isLoading} key={key} reasoning={part.reasoning} />;
                        }

                        if (isUserMessage && part.type === "text" && part.text) {
                            return (
                                <UserMessagePart
                                    isError={isError}
                                    isLast={isLastPart}
                                    key={key}
                                    message={message}
                                    part={part}
                                    reload={reload}
                                    setMessages={setMessages}
                                    status={status}
                                />
                            );
                        }

                        if (part.type === "text" && !isUserMessage) {
                            return (
                                <AssistMessagePart
                                    isError={isError}
                                    isLast={isLastMessage && isLastPart}
                                    isLoading={isLoading}
                                    key={key}
                                    message={message}
                                    part={part}
                                    reload={reload}
                                    setMessages={setMessages}
                                    showActions={isLastMessage ? isLastPart && !isLoading : isLastPart}
                                    threadId={threadId}
                                />
                            );
                        }

                        if (part.type === "tool-invocation") {
                            const isLast = isLastMessage && isLastPart;

                            const isManualToolInvocation = (message.annotations as ChatMessageAnnotation[])?.some((a) => a.toolChoice === "manual");

                            return (
                                <ToolMessagePart
                                    isError={isError}
                                    isLast={isLast}
                                    isManualToolInvocation={isManualToolInvocation}
                                    key={key}
                                    messageId={message.id}
                                    onProxyToolCall={onProxyToolCall}
                                    part={part}
                                    setMessages={setMessages}
                                    showActions={isLastMessage ? isLastPart && !isLoading : isLastPart}
                                />
                            );
                        }
                    })}
                </div>
            </div>
        </div>
    );
};

export const PreviewMessage = memo(PurePreviewMessage, (previousProperties, nextProperties) => {
    if (previousProperties.message.id !== nextProperties.message.id) {
        return false;
    }

    if (previousProperties.isLoading !== nextProperties.isLoading) {
        return false;
    }

    if (previousProperties.isLastMessage !== nextProperties.isLastMessage) {
        return false;
    }

    if (previousProperties.className !== nextProperties.className) {
        return false;
    }

    if (previousProperties.status !== nextProperties.status) {
        return false;
    }

    if (previousProperties.message.annotations !== nextProperties.message.annotations) {
        return false;
    }

    if (previousProperties.isError !== nextProperties.isError) {
        return false;
    }

    if (previousProperties.onProxyToolCall !== nextProperties.onProxyToolCall) {
        return false;
    }

    if (!equal(previousProperties.message.parts, nextProperties.message.parts)) {
        return false;
    }

    return true;
});

export const ErrorMessage = ({ error }: { error: Error; message?: UIMessage }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const maxLength = 200;
    const { t } = useLingui();

    return (
        <div className="animate-in fade-in mx-auto mt-4 w-full max-w-3xl px-6">
            <Alert className="border-destructive" variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle className="mb-2">{t`Chat.Error`}</AlertTitle>
                <AlertDescription className="text-sm">
                    <div className="whitespace-pre-wrap">{isExpanded ? error.message : truncateString(error.message, maxLength)}</div>
                    {error.message.length > maxLength && (
                        <Button className="ml-auto" onClick={() => setIsExpanded(!isExpanded)} size="sm" variant="ghost">
                            {isExpanded
                                ? (
                                    <>
                                        <ChevronUp className="h-3 w-3" />
                                        {t`Common.showLess`}
                                    </>
                                )
                                : (
                                    <>
                                        <ChevronDown className="h-3 w-3" />
                                        {t`Common.showMore`}
                                    </>
                                )}
                        </Button>
                    )}
                </AlertDescription>
                <AlertDescription>
                    <p className="text-muted-foreground my-2 text-sm">{t`Chat.thisMessageWasNotSavedPleaseTryTheChatAgain`}</p>
                </AlertDescription>
            </Alert>
        </div>
    );
};
