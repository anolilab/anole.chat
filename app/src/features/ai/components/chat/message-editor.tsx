"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { Button } from "@anole/ui/components/button";
import { Textarea } from "@anole/ui/components/textarea";
import type { Message } from "ai";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";

type TextUIPart = {
    text: string;
    type: "text";
};

export type MessageEditorProps = {
    message: Message;
    reload: UseChatHelpers["reload"];
    setMessages: UseChatHelpers["setMessages"];
    setMode: Dispatch<SetStateAction<"view" | "edit">>;
};

export const MessageEditor = ({ message, reload, setMessages, setMode }: MessageEditorProps) => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [draftParts, setDraftParts] = useState<TextUIPart[]>(() => {
        if (message.parts && message.parts.length > 0) {
            return message.parts.map((part: any) => {
                return {
                    text: part.text,
                    type: "text",
                };
            });
        }

        return [{ text: "", type: "text" }];
    });

    const handlePartChange = (index: number, value: string) => {
        setDraftParts((previous) => {
            const newParts = [...previous];

            newParts[index] = { text: value, type: "text" };

            return newParts;
        });
    };

    return (
        <div className="mb-4 flex w-full flex-col gap-4">
            {draftParts.map((part, index) => (
                <div className="flex flex-col gap-2" key={index}>
                    <Textarea
                        className="min-h-[100px] w-full resize-none overflow-hidden overflow-y-auto rounded-xl bg-transparent !text-base outline-none"
                        data-testid={`message-editor-part-${index}`}
                        onChange={(e) => handlePartChange(index, e.target.value)}
                        placeholder={`Part ${index + 1}`}
                        value={part.text}
                    />
                </div>
            ))}

            <div className="flex flex-row justify-end gap-2">
                <Button
                    className="h-fit px-3 py-2"
                    onClick={() => {
                        setMode("view");
                    }}
                    size="sm"
                    variant="outline"
                >
                    Cancel
                </Button>
                <Button
                    className="h-fit px-3 py-2"
                    data-testid="message-editor-send-button"
                    disabled={isSubmitting}
                    onClick={async () => {
                        setIsSubmitting(true);

                        // await deleteMessagesByChatIdAfterTimestampAction(message.id);

                        setMessages((messages) => {
                            const index = messages.findIndex((m) => m.id === message.id);

                            if (index !== -1) {
                                const updatedMessage: Message = {
                                    ...message,
                                    parts: draftParts,
                                };

                                return [...messages.slice(0, index), updatedMessage];
                            }

                            return messages;
                        });

                        setMode("view");
                        reload({});
                    }}
                    size="sm"
                    variant="default"
                >
                    {isSubmitting ? "Saving..." : "Save"}
                </Button>
            </div>
        </div>
    );
};
