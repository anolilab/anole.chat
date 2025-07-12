"use client";

import { AttachmentPrimitive, ComposerPrimitive, MessagePrimitive, useAttachment } from "@assistant-ui/react";
import { CircleXIcon, FileIcon, PaperclipIcon } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import type { FC, PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const useFileSource = (file: File | undefined) => {
    const [source, setSource] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!file) {
            setSource(undefined);

            return;
        }

        const objectUrl = URL.createObjectURL(file);

        setSource(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [file]);

    return source;
};

const useAttachmentSource = () => {
    const { file, src } = useAttachment(
        useShallow((a): { file?: File; src?: string } => {
            if (a.type !== "image")
                return {};

            if (a.file)
                return { file: a.file };

            const source = a.content?.filter((c) => c.type === "image")[0]?.image;

            if (!source)
                return {};

            return { src: source };
        }),
    );

    return useFileSource(file) ?? src;
};

type AttachmentPreviewProperties = {
    src: string;
};

const AttachmentPreview: FC<AttachmentPreviewProperties> = ({ src }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            alt="Preview"
            onLoad={() => {
                setIsLoaded(true);
            }}
            src={src}
            style={{
                display: isLoaded ? "block" : "none",
                height: "auto",
                maxHeight: "75dvh",
                maxWidth: "75dvh",
                overflow: "clip",
                width: "auto",
            }}
        />
    );
};

const AttachmentPreviewDialog: FC<PropsWithChildren> = ({ children }) => {
    const source = useAttachmentSource();

    if (!source)
        return children;

    return (
        <Dialog>
            <DialogTrigger asChild className="hover:bg-accent/50 cursor-pointer transition-colors">
                {children}
            </DialogTrigger>
            <AttachmentDialogContent>
                <DialogTitle className="aui-sr-only">Image Attachment Preview</DialogTitle>
                <AttachmentPreview src={source} />
            </AttachmentDialogContent>
        </Dialog>
    );
};

const AttachmentThumb: FC = () => {
    const isImage = useAttachment((a) => a.type === "image");
    const source = useAttachmentSource();

    return (
        <Avatar className="bg-muted flex size-10 items-center justify-center rounded border text-sm">
            <AvatarFallback delayMs={isImage ? 200 : 0}>
                <FileIcon />
            </AvatarFallback>
            <AvatarImage src={source} />
        </Avatar>
    );
};

const AttachmentUI: FC = () => {
    const canRemove = useAttachment((a) => a.source !== "message");
    const typeLabel = useAttachment((a) => {
        const { type } = a;

        switch (type) {
            case "document": {
                return "Document";
            }
            case "file": {
                return "File";
            }
            case "image": {
                return "Image";
            }
            default: {
                const _exhaustiveCheck: never = type;

                throw new Error(`Unknown attachment type: ${_exhaustiveCheck}`);
            }
        }
    });

    return (
        <Tooltip>
            <AttachmentPrimitive.Root className="relative mt-3">
                <AttachmentPreviewDialog>
                    <TooltipTrigger asChild>
                        <div className="flex h-12 w-40 items-center justify-center gap-2 rounded-lg border p-1">
                            <AttachmentThumb />
                            <div className="flex-grow basis-0">
                                <p className="text-muted-foreground line-clamp-1 text-ellipsis break-all text-xs font-bold">
                                    <AttachmentPrimitive.Name />
                                </p>
                                <p className="text-muted-foreground text-xs">{typeLabel}</p>
                            </div>
                        </div>
                    </TooltipTrigger>
                </AttachmentPreviewDialog>
                {canRemove && <AttachmentRemove />}
            </AttachmentPrimitive.Root>
            <TooltipContent side="top">
                <AttachmentPrimitive.Name />
            </TooltipContent>
        </Tooltip>
    );
};

const AttachmentRemove: FC = () => (
    <AttachmentPrimitive.Remove asChild>
        <TooltipIconButton
            className="text-muted-foreground [&>svg]:bg-background absolute -right-3 -top-3 size-6 [&>svg]:size-4 [&>svg]:rounded-full"
            side="top"
            tooltip="Remove file"
        >
            <CircleXIcon />
        </TooltipIconButton>
    </AttachmentPrimitive.Remove>
);

export const UserMessageAttachments: FC = () => (
    <div className="col-span-full col-start-1 row-start-1 flex w-full flex-row justify-end gap-3">
        <MessagePrimitive.Attachments components={{ Attachment: AttachmentUI }} />
    </div>
);

export const ComposerAttachments: FC = () => (
    <div className="flex w-full flex-row gap-3 overflow-x-auto">
        <ComposerPrimitive.Attachments components={{ Attachment: AttachmentUI }} />
    </div>
);

export const ComposerAddAttachment: FC = () => (
    <ComposerPrimitive.AddAttachment asChild>
        <TooltipIconButton className="size-8 p-2 transition-opacity ease-in hover:text-neutral-500" tooltip="Add Attachment" variant="icon">
            <PaperclipIcon />
        </TooltipIconButton>
    </ComposerPrimitive.AddAttachment>
);

const AttachmentDialogContent: FC<PropsWithChildren> = ({ children }) => (
    <DialogPortal>
        <DialogOverlay />
        <RadixDialog.Content className="aui-dialog-content">{children}</RadixDialog.Content>
    </DialogPortal>
);
