"use client";

import { Button } from "@anole/ui/components/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@anole/ui/components/dialog";
import { FlipWords } from "@anole/ui/components/flip-words";
import { Input } from "@anole/ui/components/input";
import { handleErrorWithToast } from "@anole/ui/components/shared-toast";
import { useLingui } from "@lingui/react/macro";
import { useNavigate } from "@tanstack/react-router";
import { Lightbulb, Loader } from "lucide-react";
import type { KeyboardEvent, PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

import { insertProjectAction } from "@/app/api/chat/actions";

export const CreateProjectPopup = ({ children }: PropsWithChildren) => {
    const { t } = useLingui();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const navigate = useNavigate();

    const handleCreate = async () => {
        setIsLoading(true);

        try {
            const project = await insertProjectAction({ name });

            setIsOpen(false);
            toast.success(t`Chat.Project.projectCreated`);
            await mutate("/api/project/list");
            navigate({ to: `/project/${project.id}` });
        } catch (error) {
            handleErrorWithToast(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnterKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            handleCreate();
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setName("");
        }
    }, [isOpen]);

    return (
        <Dialog onOpenChange={setIsOpen} open={isOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t`Chat.Project.project`}</DialogTitle>
                    <DialogDescription asChild className="my-0! bg-transparent">
                        <div className="bg-muted my-2 flex gap-2 rounded-lg p-4">
                            <div className="mt-1 px-2">
                                <Lightbulb className="text-accent-foreground size-4 animate-pulse" />
                            </div>
                            <div className="">
                                <p className="text-accent-foreground mb-1 font-semibold">{t`Chat.Project.whatIsAProject`}</p>
                                <FlipWords
                                    className="text-muted-foreground px-0"
                                    words={[t`Chat.Project.aProjectAllowsYouToOrganizeYourFilesAndCustomInstructionsInOneConvenientPlace`]}
                                />
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <div className="w-full">
                    <Input
                        autoFocus
                        className="bg-card flex-1"
                        id="name"
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={handleEnterKey}
                        placeholder={t`Chat.Project.enterNameForNewProject`}
                        value={name}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild disabled={isLoading}>
                        <Button variant="ghost">{t`Common.cancel`}</Button>
                    </DialogClose>
                    <Button disabled={isLoading || !name.trim()} onClick={handleCreate} type="submit" variant="secondary">
                        {isLoading && <Loader className="size-4 animate-spin" />}
                        {t`Common.create`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
