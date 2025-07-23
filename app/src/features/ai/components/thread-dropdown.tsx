"use client";

import { Button } from "@anole/ui/components/button";
import { Command, CommandGroup, CommandItem, CommandList, CommandSeparator } from "@anole/ui/components/command";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@anole/ui/components/dialog";
import { Input } from "@anole/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@anole/ui/components/popover";
import { useLingui } from "@lingui/react/macro";
import { Loader, PencilLine, Trash, WandSparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { safe } from "ts-safe";

import { deleteThreadAction, updateThreadAction } from "@/app/api/chat/actions";
import { useToRef } from "@/hooks/use-latest";

import { appStore } from "../store";
import { CreateProjectWithThreadPopup } from "./create-project-with-thread-popup";

type Properties = PropsWithChildren<{
    align?: "start" | "end" | "center";
    beforeTitle?: string;
    onDeleted?: () => void;
    side?: "top" | "bottom" | "left" | "right";
    threadId: string;
}>;

export const ThreadDropdown = ({ align, beforeTitle, children, onDeleted, side, threadId }: Properties) => {
    const navigate = useNavigate();
    const { t } = useLingui();
    const push = useToRef((path: string) => navigate({ to: path }));

    const currentThreadId = appStore((state) => state.currentThreadId);

    const [open, setOpen] = useState(false);

    const [isDeleting, setIsDeleting] = useState(false);

    const handleUpdate = async (title: string) => {
        safe()
            .ifOk(() => {
                if (!title) {
                    throw new Error(t`titleRequired`);
                }
            })
            .ifOk(() => updateThreadAction(threadId, { title }))
            .ifOk(() => mutate("/api/thread/list"))
            .watch(({ error, isOk }) => {
                if (isOk) {
                    toast.success(t`threadUpdated`);
                } else {
                    toast.error(error.message || t`failedToUpdateThread`);
                }
            });
    };

    const handleDelete = async (_e: React.MouseEvent) => {
        safe()
            .watch(() => setIsDeleting(true))
            .ifOk(() => deleteThreadAction(threadId))
            .watch(() => setIsDeleting(false))
            .watch(() => setOpen(false))
            .watch(({ error, isOk }) => {
                if (isOk) {
                    toast.success(t`threadDeleted`);
                } else {
                    toast.error(error.message || t`failedToDeleteThread`);
                }
            })
            .ifOk(() => onDeleted?.())
            .ifOk(() => {
                if (currentThreadId === threadId) {
                    push.current("/");
                }

                mutate("/api/thread/list");
            })
            .unwrap();
    };

    return (
        <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent align={align} className="w-[220px] p-0" side={side}>
                <Command>
                    <div className="text-muted-foreground ml-1 flex items-center gap-2 px-2 py-1 pt-2 text-xs">{t`chat`}</div>

                    <CommandList>
                        <CommandGroup>
                            <CommandItem className="cursor-pointer">
                                <CreateProjectWithThreadPopup onClose={() => setOpen(false)} threadId={threadId}>
                                    <div className="flex w-full items-center gap-2">
                                        <WandSparkles className="text-foreground" />
                                        <span className="mr-4">{t`summarizeAsProject`}</span>
                                    </div>
                                </CreateProjectWithThreadPopup>
                            </CommandItem>
                            <CommandItem className="cursor-pointer p-0">
                                <UpdateThreadNameDialog initialTitle={beforeTitle ?? ""} onUpdated={(title) => handleUpdate(title)}>
                                    <div className="flex w-full items-center gap-2 rounded px-2 py-1">
                                        <PencilLine className="text-foreground" />
                                        <span className="mr-4">{t`renameChat`}</span>
                                    </div>
                                </UpdateThreadNameDialog>
                            </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem className="cursor-pointer p-0" disabled={isDeleting}>
                                <div className="flex w-full items-center gap-2 rounded px-2 py-1" onClick={handleDelete}>
                                    <Trash className="text-destructive" />
                                    <span className="text-destructive">{t`deleteChat`}</span>
                                    {isDeleting && <Loader className="ml-auto h-4 w-4 animate-spin" />}
                                </div>
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const UpdateThreadNameDialog = ({
    children,
    initialTitle,
    onUpdated,
}: PropsWithChildren<{
    initialTitle: string;
    onUpdated: (title: string) => void;
}>) => {
    const [title, setTitle] = useState(initialTitle);
    const { t } = useLingui();

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent hideClose>
                <DialogHeader>
                    <DialogTitle>{t`Chat.Thread.renameChat`}</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    <Input
                        onInput={(e) => {
                            setTitle(e.currentTarget.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                onUpdated(title);
                            }
                        }}
                        type="text"
                        value={title}
                    />
                </DialogDescription>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">{t`Common.cancel`}</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={() => onUpdated(title)} variant="outline">
                            {t`Common.update`}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
