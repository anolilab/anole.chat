import { MessagePrimitive } from "@assistant-ui/react";
import { MarkdownText } from "./markdown-text";
import type { FC } from "react";

export const UserMessage: FC = () => {
    return (
        <MessagePrimitive.Root>
            <div className="relative grid w-full max-w-[var(--thread-max-width)] grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] py-4">
                <div className="text-foreground col-span-2 col-start-2 row-start-1 my-1.5 max-w-[var(--thread-max-width)] break-words leading-7">
                    <MessagePrimitive.Content />
                </div>
            </div>
        </MessagePrimitive.Root>
    );
};

export const AssistantMessage: FC = () => {
    return (
        <MessagePrimitive.Root>
            <div className="relative grid w-full max-w-[var(--thread-max-width)] grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] py-4">
                <div className="text-foreground col-span-2 col-start-2 row-start-1 my-1.5 max-w-[var(--thread-max-width)] break-words leading-7">
                    <MessagePrimitive.Content components={{ Text: MarkdownText }} />
                </div>
            </div>
        </MessagePrimitive.Root>
    );
};
