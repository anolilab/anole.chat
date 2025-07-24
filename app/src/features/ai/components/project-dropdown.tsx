"use client";

import { Button } from "@anole/ui/components/button";
import { Command, CommandGroup, CommandItem, CommandList, CommandSeparator } from "@anole/ui/components/command";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@anole/ui/components/dialog";
import { Input } from "@anole/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@anole/ui/components/popover";
import { useLingui } from "@lingui/react/macro";
import { useNavigate } from "@tanstack/react-router";
import { AudioWaveformIcon, Loader, PencilLine, Trash } from "lucide-react";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { v4 as uuidv4 } from "uuid";
import { useShallow } from "zustand/shallow";

import { deleteProjectAction, updateProjectNameAction } from "@/app/api/chat/actions";
import type { Project } from "@/types/chat";

import { appStore } from "../store";

type Properties = PropsWithChildren<{
    align?: "start" | "end" | "center";
    project: Pick<Project, "id" | "name">;
    side?: "top" | "bottom" | "left" | "right";
}>;

export const ProjectDropdown = ({ align, children, project, side }: Properties) => {
    const navigate = useNavigate();
    const { t } = useLingui();
    const [currentProjectId, appStoreMutate] = appStore(useShallow((state) => [state.currentProjectId, state.mutate]));

    const [open, setOpen] = useState(false);

    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleting(true);

        try {
            await deleteProjectAction(project.id);
            setIsDeleting(false);
            toast.success(t`Chat.Project.projectDeleted`);

            if (currentProjectId === project.id) {
                navigate({ to: "/" });
            }

            mutate("/api/thread/list");
            mutate("/api/project/list");
        } catch (error) {
            setIsDeleting(false);
            toast.error(error.message || t`Chat.Project.failedToDeleteProject`);
        }
    };

    return (
        <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent align={align} className="w-[220px] p-0" side={side}>
                <Command>
                    <div className="text-muted-foreground ml-1 flex items-center gap-2 px-2 py-1 pt-2 text-xs">{t`Chat.Project.project`}</div>

                    <CommandList>
                        <CommandGroup>
                            <CommandItem className="cursor-pointer p-0">
                                <div
                                    className="flex w-full items-center gap-2 rounded px-2 py-1"
                                    onClick={() => {
                                        appStoreMutate((state) => {
                                            return {
                                                voiceChat: {
                                                    ...state.voiceChat,
                                                    isOpen: true,
                                                    projectId: project.id,
                                                    threadId: uuidv4(),
                                                },
                                            };
                                        });
                                    }}
                                >
                                    <AudioWaveformIcon className="text-foreground" />
                                    <span>{t`Chat.VoiceChat.title`}</span>
                                </div>
                            </CommandItem>
                            <CommandItem className="cursor-pointer p-0">
                                <UpdateProjectNameDialog initialName={project.name} onUpdated={() => setOpen(false)} projectId={project.id}>
                                    <div className="flex w-full items-center gap-2 rounded px-2 py-1">
                                        <PencilLine className="text-foreground" />
                                        {t`Chat.Project.renameProject`}
                                    </div>
                                </UpdateProjectNameDialog>
                            </CommandItem>
                            <CommandSeparator className="my-1" />

                            <CommandItem className="cursor-pointer p-0" disabled={isDeleting}>
                                <div className="flex w-full items-center gap-2 rounded px-2 py-1" onClick={handleDelete}>
                                    <Trash className="text-destructive" />
                                    <span className="text-destructive">{t`Chat.Project.deleteProject`}</span>
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

const UpdateProjectNameDialog = ({
    children,
    initialName,
    onUpdated,
    projectId,
}: PropsWithChildren<{
    initialName: string;
    onUpdated: (name: string) => void;
    projectId: string;
}>) => {
    const { t } = useLingui();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState(initialName);

    const handleUpdate = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsUpdating(true);

        try {
            await updateProjectNameAction(projectId, name);
            setIsUpdating(false);
            setIsOpen(false);
            onUpdated(name);
            mutate("/api/project/list");
            mutate(`/projects/${projectId}`);
            toast.success(t`Chat.Project.projectUpdated`);
        } catch (error) {
            setIsUpdating(false);
            setIsOpen(false);
            toast.error(error.message || t`Chat.Project.failedToUpdateProject`);
        }
    };

    return (
        <Dialog onOpenChange={setIsOpen} open={isOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent hideClose>
                <DialogHeader>
                    <DialogTitle>{t`Chat.Project.renameProject`}</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    <Input onChange={(e) => setName(e.target.value)} type="text" value={name} />
                </DialogDescription>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">{t`Common.cancel`}</Button>
                    </DialogClose>

                    <Button onClick={handleUpdate} variant="outline">
                        {isUpdating ? <Loader className="h-4 w-4 animate-spin" /> : t`Common.update`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
