"use client";

import cn from "@anole/ui/utils/cn";
import Mention from "@tiptap/extension-mention";
import type { Editor, Range, UseEditorOptions } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { FC, RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import type { TipTapMentionJsonContent } from "@/types/util";

interface MentionInputProperties {
    className?: string;
    content?: TipTapMentionJsonContent | string;
    defaultContent?: TipTapMentionJsonContent | string;
    disabled?: boolean;
    editorRef?: RefObject<Editor | null>;
    MentionItem: FC<{
        id: string;
        label: string;
    }>;
    onChange?: (content: { json: TipTapMentionJsonContent; mentions: { id: string; label: string }[]; text: string }) => void;
    onEnter?: () => void;
    placeholder?: string;
    Suggestion: FC<{
        left: number;
        onClose: () => void;
        onSelectMention: (item: { id: string; label: string }) => void;
        top: number;
    }>;
    suggestionChar?: string;
}

export default function MentionInput({
    className,
    content,
    defaultContent,
    disabled,
    editorRef,
    MentionItem,
    onChange,
    onEnter,
    placeholder = "",
    Suggestion,
    suggestionChar = "@",
}: MentionInputProperties) {
    const [open, setOpen] = useState(false);
    const position = useRef<{
        left: number;
        range: Range;
        top: number;
    } | null>(null);
    const latestContent = useRef<{
        json: TipTapMentionJsonContent;
        text: string;
    } | null>(null);

    // Memoize editor configuration
    const editorConfig = useMemo<UseEditorOptions>(() => {
        return {
            autofocus: true,
            content: defaultContent ?? content,
            editable: !disabled,
            editorProps: {
                attributes: {
                    class: "w-full max-h-80 min-h-[2rem] break-words overflow-y-auto resize-none focus:outline-none px-2 py-1 prose prose-sm dark:prose-invert ",
                },
            },
            extensions: [
                StarterKit.configure({
                    blockquote: false,
                    code: false,
                    codeBlock: false,
                }),
                Mention.configure({
                    HTMLAttributes: {
                        class: "mention",
                    },
                    renderHTML: (properties) => {
                        const element = document.createElement("div");

                        element.className = "inline-flex";
                        const root = createRoot(element);

                        root.render(<MentionItem id={properties.node.attrs.id} label={properties.node.attrs.label} />);

                        return element;
                    },
                    suggestion: {
                        char: suggestionChar,
                        render: () => {
                            return {
                                onExit: () => setOpen(false),
                                onStart: (properties) => {
                                    const rect = properties.clientRect?.();

                                    if (rect) {
                                        position.current = {
                                            left: rect.left,
                                            range: properties.range,
                                            top: rect.top,
                                        };
                                        setOpen(true);
                                    }
                                },
                            };
                        },
                    },
                }),
            ],
            immediatelyRender: false,
            onUpdate: ({ editor }) => {
                const json = editor.getJSON() as TipTapMentionJsonContent;
                const text = editor.getText();
                const mentions = json?.content?.flatMap(({ content }) => content?.filter((v) => v.type == "mention").map((v) => v.attrs)).filter(Boolean) as {
                    id: string;
                    label: string;
                }[];

                latestContent.current = {
                    json,
                    text,
                };
                onChange?.({
                    json,
                    mentions,
                    text,
                });
            },
        };
    }, [disabled, MentionItem, suggestionChar, onChange]);

    const editor = useEditor(editorConfig);

    // Expose editor through ref
    useEffect(() => {
        if (editorRef && editor) {
            editorRef.current = editor;
        }
    }, [editor]);

    useEffect(() => {
        editor?.setEditable(!disabled);
    }, [disabled]);

    // Memoize handlers
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            const isSubmit = !open && e.key === "Enter" && editor?.getText().trim().length && !e.shiftKey && !e.nativeEvent.isComposing;

            if (isSubmit)
                onEnter?.();
        },
        [editor, onEnter, open],
    );

    // Memoize the DOM structure
    const suggestion = useMemo(() => {
        if (!open)
            return null;

        return (
            <Suggestion
                left={position.current?.left ?? 0}
                onClose={() => {
                    setOpen(false);
                }}
                onSelectMention={(item) => {
                    editor
                        ?.chain()
                        .focus()
                        .insertContentAt(position.current!.range, [
                            {
                                attrs: item,
                                type: "mention",
                            },
                        ])
                        .run();
                    setOpen(false);
                }}
                top={position.current?.top ?? 0}
            />
        );
    }, [open]);

    const placeholderElement = useMemo(() => {
        if (!editor?.isEmpty)
            return null;

        return <div className="text-muted-foreground pointer-events-none absolute top-1 left-2">{placeholder}</div>;
    }, [editor?.isEmpty, placeholder]);

    useEffect(() => {
        if (open) {
            return () => {
                editor?.commands.focus();
            };
        }

        position.current = null;
        editor?.commands.focus();
    }, [open]);

    useEffect(() => {
        if (content != undefined && onChange) {
            if (typeof content === "string" && content != latestContent.current?.text) {
                editor?.commands.setContent(content);
            } else if (typeof content !== "string" && content != latestContent.current?.json) {
                editor?.commands.setContent(content);
            }
        }
    }, [content]);

    const focus = useCallback(() => {
        editor?.commands.focus();
    }, [editor]);

    return (
        <div className={cn("relative w-full", className)} onClick={focus}>
            <EditorContent editor={editor} onKeyDown={handleKeyDown} />
            {suggestion}
            {placeholderElement}
        </div>
    );
}
