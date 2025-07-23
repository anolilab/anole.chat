"use client";

import { Button } from "@anole/ui/components/button";
import { Command, CommandGroup, CommandItem, CommandList, CommandSeparator } from "@anole/ui/components/command";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@anole/ui/components/dialog";
import { Input } from "@anole/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@anole/ui/components/popover";
import { useLingui } from "@lingui/react/macro";
import { AudioWaveformIcon, Loader, PencilLine, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { safe } from "ts-safe";
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
    const router = useRouter();
    const { t } = useLingui();
    const [currentProjectId, appStoreMutate] = appStore(useShallow((state) => [state.currentProjectId, state.mutate]));

    const [open, setOpen] = useState(false);

    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        safe()
            .watch(() => setIsDeleting(true))
            .ifOk(() => deleteProjectAction(project.id))
            .watch(() => setIsDeleting(false))
            .watch(({ error, isOk }) => {
                if (isOk) {
                    toast.success(t`Chat.Project.projectDeleted`);
                } else {
                    toast.error(error.message || t`Chat.Project.failedToDeleteProject`);
                }
            })
            .ifOk(() => {
                if (currentProjectId === project.id) {
                    router.push("/");
                }

                mutate("/api/thread/list");
                mutate("/api/project/list");
            })
            .unwrap();
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

        return safe(() => updateProjectNameAction(projectId, name))
            .watch(({ error, isOk }) => {
                setIsUpdating(false);
                setIsOpen(false);

                if (isOk) {
                    onUpdated(name);
                    mutate("/api/project/list");
                    mutate(`/projects/${projectId}`);
                    toast.success(t`Chat.Project.projectUpdated`);
                } else {
                    toast.error(error.message || t`Chat.Project.failedToUpdateProject`);
                }
            })
            .unwrap();
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
