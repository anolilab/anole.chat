"use client";

import { Button } from "@anole/ui/components/button";
import { Command, CommandGroup, CommandItem, CommandList, CommandSeparator } from "@anole/ui/components/command";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@anole/ui/components/dialog";
import { Input } from "@anole/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@anole/ui/components/popover";
import { useLingui } from "@lingui/react/macro";
import { useNavigate } from "@tanstack/react-router";
import { Loader, PencilLine, Trash, WandSparkles } from "lucide-react";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

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
        try {
            if (!title) {
                throw new Error(t`Title is required`);
            }

            await updateThreadAction(threadId, { title });
            await mutate("/api/thread/list");
            toast.success(t`Thread updated`);
        } catch (error) {
            toast.error(error.message || t`Failed to update thread`);
        }
    };

    const handleDelete = async (_e: React.MouseEvent) => {
        setIsDeleting(true);

        try {
            await deleteThreadAction(threadId);
            setIsDeleting(false);
            setOpen(false);
            toast.success(t`Thread deleted`);
            onDeleted?.();

            if (currentThreadId === threadId) {
                push.current("/");
            }

            mutate("/api/thread/list");
        } catch (error) {
            setIsDeleting(false);
            setOpen(false);
            toast.error(error.message || t`Failed to delete thread`);
        }
    };

    return (
        <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent align={align} className="w-[220px] p-0" side={side}>
                <Command>
                    <div className="text-muted-foreground ml-1 flex items-center gap-2 px-2 py-1 pt-2 text-xs">{t`Chat`}</div>

                    <CommandList>
                        <CommandGroup>
                            <CommandItem className="cursor-pointer">
                                <CreateProjectWithThreadPopup onClose={() => setOpen(false)} threadId={threadId}>
                                    <div className="flex w-full items-center gap-2">
                                        <WandSparkles className="text-foreground" />
                                        <span className="mr-4">{t`Summarize as Project`}</span>
                                    </div>
                                </CreateProjectWithThreadPopup>
                            </CommandItem>
                            <CommandItem className="cursor-pointer p-0">
                                <UpdateThreadNameDialog initialTitle={beforeTitle ?? ""} onUpdated={(title) => handleUpdate(title)}>
                                    <div className="flex w-full items-center gap-2 rounded px-2 py-1">
                                        <PencilLine className="text-foreground" />
                                        <span className="mr-4">{t`Re Name`}</span>
                                    </div>
                                </UpdateThreadNameDialog>
                            </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem className="cursor-pointer p-0" disabled={isDeleting}>
                                <div className="flex w-full items-center gap-2 rounded px-2 py-1" onClick={handleDelete}>
                                    <Trash className="text-destructive" />
                                    <span className="text-destructive">{t`Delete Chat`}</span>
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
                    <DialogTitle>{t`Re Name`}</DialogTitle>
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
                        <Button variant="secondary">{t`Cancel`}</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={() => onUpdated(title)} variant="outline">
                            {t`Update`}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
