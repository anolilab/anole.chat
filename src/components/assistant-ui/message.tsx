import { MessagePrimitive } from "@assistant-ui/react";
import { MarkdownText } from "./markdown-text";
import type { FC } from "react";

export const UserMessage: FC = () => {
    return (
        <MessagePrimitive.Root>
            <div className="grid grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] relative w-full max-w-[var(--thread-max-width)] py-4">
                <div className="text-foreground max-w-[calc(var(--thread-max-width)*0.8)] break-words leading-7 col-span-2 col-start-2 row-start-1 my-1.5">
                    <MessagePrimitive.Content />
                </div>
            </div>
        </MessagePrimitive.Root>
    );
};

export const AssistantMessage: FC = () => {
    return (
        <MessagePrimitive.Root>
            <div className="grid grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] relative w-full max-w-[var(--thread-max-width)] py-4">
                <div className="text-foreground max-w-[calc(var(--thread-max-width)*0.8)] break-words leading-7 col-span-2 col-start-2 row-start-1 my-1.5">
                    <MessagePrimitive.Content components={{ Text: MarkdownText }} />
                </div>
            </div>
        </MessagePrimitive.Root>
    );
}; 