"use client";

import { Button } from "@anole/ui/components/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@anole/ui/components/dialog";
import { handleErrorWithToast } from "@anole/ui/components/shared-toast";
import { Textarea } from "@anole/ui/components/textarea";
import { useLingui } from "@lingui/react/macro";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { updateProjectAction } from "@/app/api/chat/actions";

interface ProjectSystemMessagePopupProperties {
    beforeSystemMessage?: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (systemPrompt: string) => void;
    projectId: string;
}

export const ProjectSystemMessagePopup = ({ beforeSystemMessage, isOpen, onOpenChange, onSave, projectId }: ProjectSystemMessagePopupProperties) => {
    const { t } = useLingui();
    const [systemPrompt, setSystemPrompt] = useState(beforeSystemMessage || "");
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);

        try {
            await updateProjectAction(projectId, { instructions: { systemPrompt } });
            onSave(systemPrompt);
            toast.success(t`Chat.Project.projectInstructionsUpdated`);
            onOpenChange(false);
        } catch (error) {
            handleErrorWithToast(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setSystemPrompt(beforeSystemMessage || "");
        }
    }, [isOpen]);

    return (
        <Dialog onOpenChange={onOpenChange} open={isOpen}>
            <DialogContent className="bg-card w-full sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{t`Chat.Project.projectInstructions`}</DialogTitle>
                    <DialogDescription asChild>
                        <div className="py-4">
                            <p className="mb-2 font-semibold">{t`Chat.Project.howCanTheChatBotBestHelpYouWithThisProject`}</p>
                            {t`Chat.Project.youCanAskTheChatBotToFocusOnASpecificTopicOrToRespondInAParticularToneOrFormat`}
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex w-full items-center gap-2 overflow-x-auto">
                    <Textarea
                        autoFocus
                        className="max-h-[400px] min-h-[200px] w-full resize-none"
                        id="system-prompt"
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        placeholder="e.g. You are a Korean travel guide ChatBot. Respond only in Korean, include precise times for every itinerary item, and present transportation, budget, and dining recommendations succinctly in a table format."
                        value={systemPrompt}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild disabled={isLoading}>
                        <Button variant="ghost">{t`Common.cancel`}</Button>
                    </DialogClose>
                    <Button disabled={isLoading || !systemPrompt.trim()} onClick={handleSave} type="submit" variant="secondary">
                        {isLoading && <Loader className="size-4 animate-spin" />}
                        {t`Common.save`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
