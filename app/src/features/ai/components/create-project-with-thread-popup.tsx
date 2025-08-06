"use client";

import { useCompletion } from "@ai-sdk/react";
import { Button } from "@anole/ui/components/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@anole/ui/components/dialog";
import { Input } from "@anole/ui/components/input";
import { Label } from "@anole/ui/components/label";
import { handleErrorWithToast } from "@anole/ui/components/shared-toast";
import { Textarea } from "@anole/ui/components/textarea";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, ChevronsUpDown, Lightbulb, Loader, WandSparkles } from "lucide-react";
import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

import { insertProjectAction } from "@/app/api/chat/actions";
import { useObjectState } from "@/hooks/use-object-state";

import { appStore } from "../store";
import { SelectModel } from "./select-model";

interface CreateProjectWithThreadPopupProperties {
    onClose?: () => void;
    threadId: string;
}

const ProjectNameStep = ({ name, nextStep, setName }: { name: string; nextStep: () => void; setName: (name: string) => void }) => {
    const { t } = useLingui();

    return (
        <div className="flex h-full flex-col">
            <div className="flex flex-col gap-2">
                <Input
                    autoFocus
                    className="w-full"
                    id="name"
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            nextStep();
                        }
                    }}
                    placeholder="eg. Korea Trip Plan"
                    value={name}
                />
            </div>

            <div className="mt-auto flex justify-end pt-4">
                <DialogClose asChild>
                    <Button className="mr-2" variant="ghost">
                        {t`Cancel`}
                    </Button>
                </DialogClose>
                <Button className="gap-1" disabled={!name.trim()} onClick={nextStep}>
                    {t`Continue`}
                    <ArrowRight className="size-4" />
                </Button>
            </div>
        </div>
    );
};

const InstructionsStep = ({
    onSave,
    prevStep,
    setSystemPrompt,
    systemPrompt,
    threadId,
}: {
    onSave: () => void;
    prevStep: () => void;
    setSystemPrompt: (systemPrompt: string) => void;
    systemPrompt: string;
    threadId: string;
}) => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);
    const defaultModel = appStore((state) => state.chatModel);
    const [model, setModel] = useState(defaultModel);

    const { complete, completion } = useCompletion({
        api: "/api/chat/summarize",
    });

    useEffect(() => {
        setSystemPrompt(completion);
    }, [completion]);

    const generateInstructions = async () => {
        setIsLoading(true);

        try {
            await complete("", {
                body: {
                    chatModel: model,
                    threadId,
                },
            });
        } catch (error) {
            handleErrorWithToast(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-full flex-col overflow-hidden" onKeyDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2">
                <Button className="border-accent flex flex-1 items-center gap-2 rounded-full border" onClick={generateInstructions}>
                    {isLoading ? <Loader className="size-3.5 animate-spin" /> : <WandSparkles className="size-3.5" />}
                    {t`Generate With AI`}
                </Button>
                <SelectModel align="end" onSelect={setModel}>
                    <Button className="min-w-24 justify-between gap-1" variant="ghost">
                        <span>{model?.model}</span>
                        <ChevronsUpDown className="size-3.5" />
                    </Button>
                </SelectModel>
            </div>

            <div className="mt-6 mb-2 flex items-center justify-between">
                <Label className="text-sm" htmlFor="instructions">
                    {t`Instructions`}
                </Label>
            </div>
            <Textarea
                className="w-full flex-1 resize-none overflow-y-auto"
                disabled={isLoading}
                id="instructions"
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder={t`e.g. You are a Korean travel guide ChatBot. Respond only in Korean, include precise times for every itinerary item, and present transportation, budget, and dining recommendations succinctly in a table format.`}
                value={systemPrompt}
            />

            <div className="mt-4 flex justify-between">
                <Button className="gap-1" onClick={prevStep} type="button" variant="ghost">
                    <ArrowLeft className="size-4" />
                    {t`Back`}
                </Button>

                <div className="flex gap-2">
                    <DialogClose asChild>
                        <Button variant="ghost">{t`Cancel`}</Button>
                    </DialogClose>
                    <Button className="gap-1" disabled={isLoading || !systemPrompt.trim()} onClick={onSave} variant="secondary">
                        {isLoading && <Loader className="size-4 animate-spin" />}
                        {t`Save`}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const CreateProjectWithThreadPopup = ({ children, onClose, threadId }: PropsWithChildren<CreateProjectWithThreadPopupProperties>) => {
    const { t } = useLingui();
    const [isOpen, setIsOpen] = useState(false);

    const [projectOption, setProjectOption] = useObjectState({
        currentStep: 1,
        instructions: "",
        isLoading: false,
        name: "",
    });

    const navigate = useNavigate();

    const previousStep = () => {
        if (projectOption.currentStep > 1) {
            setProjectOption({
                currentStep: projectOption.currentStep - 1,
            });
        }
    };
    const nextStep = () => {
        if (projectOption.currentStep < steps.length) {
            setProjectOption({
                currentStep: projectOption.currentStep + 1,
            });
        }
    };

    const handleCreate = async () => {
        setProjectOption({ isLoading: true });

        try {
            const project = await insertProjectAction({
                instructions: {
                    systemPrompt: projectOption.instructions,
                },
                name: projectOption.name,
            });

            setIsOpen(false);
            toast.success(t`Project created`);
            await mutate("/api/project/list");
            onClose?.();
            navigate({ to: `/project/${project.id}` });
        } catch (error) {
            handleErrorWithToast(error);
        } finally {
            setProjectOption({ isLoading: false });
        }
    };
    const steps = useMemo(
        () => [
            {
                description: t`Enter a name for your new project`,
                id: 1,
                title: t`Name`,
            },
            {
                description: t`Provide custom instructions for your project assistant`,
                id: 2,
                title: t`Instructions`,
            },
        ],
        [],
    );

    const currentStepContent = useMemo(() => steps.find((step) => step.id === projectOption.currentStep), [projectOption.currentStep]);

    useEffect(() => {
        if (!isOpen) {
            setProjectOption({
                currentStep: 1,
                instructions: "",
                name: "",
            });
        }
    }, [isOpen]);

    return (
        <Dialog
            onOpenChange={(open) => {
                setIsOpen(open);

                if (!open) {
                    onClose?.();
                }
            }}
            open={isOpen}
        >
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-card overflow-hidden p-0 sm:max-w-[800px]">
                <DialogTitle className="m-0 hidden p-0">{t`Create Project`}</DialogTitle>

                <div className="flex h-[60vh]">
                    <div className="bg-muted flex w-1/3 flex-col p-6">
                        <div className="mb-6 text-xl font-bold">{t`Create Project`}</div>

                        <div className="flex-1">
                            {steps.map((step) => (
                                <div className="relative flex flex-col pb-4" key={step.id}>
                                    <div className="mb-2 flex items-start">
                                        <div
                                            className={cn(
                                                "mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                                                projectOption.currentStep < step.id
                                                    ? "border-muted-foreground/30 text-muted-foreground/50"
                                                    : "border-primary bg-primary text-primary-foreground",
                                            )}
                                        >
                                            {projectOption.currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                                        </div>
                                        <div className="flex flex-col">
                                            <span
                                                className={cn(
                                                    "font-medium",
                                                    projectOption.currentStep === step.id ? "text-foreground" : "text-muted-foreground/70",
                                                )}
                                            >
                                                {step.title}
                                            </span>
                                            <span
                                                className={cn(
                                                    "mt-0.5 text-xs",
                                                    projectOption.currentStep === step.id ? "text-muted-foreground" : "text-muted-foreground/50",
                                                )}
                                            >
                                                {step.description}
                                            </span>
                                        </div>
                                    </div>

                                    {step.id < steps.length && <div className="bg-muted-foreground absolute top-7 left-[11px] h-[calc(100%-32px)] w-0.5" />}
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto">
                            <div className="bg-background/50 rounded-lg p-4">
                                <div className="flex items-start">
                                    <Lightbulb className="text-accent-foreground mt-1 mr-2 size-4 flex-shrink-0" />
                                    <div className="text-muted-foreground text-xs">
                                        <p className="text-accent-foreground mb-1 font-semibold">{t`What is a project?`}</p>
                                        {t`A project allows you to organize your files and custom instructions in one convenient place.`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex w-2/3 flex-col p-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold">{currentStepContent?.title}</h3>
                            <p className="text-muted-foreground mt-1 text-sm">{currentStepContent?.description}</p>
                        </div>

                        {currentStepContent?.id === 1 && (
                            <ProjectNameStep name={projectOption.name} nextStep={nextStep} setName={(name) => setProjectOption({ name })} />
                        )}
                        {currentStepContent?.id === 2 && (
                            <InstructionsStep
                                onSave={handleCreate}
                                prevStep={previousStep}
                                setSystemPrompt={(instructions) => setProjectOption({ instructions })}
                                systemPrompt={projectOption.instructions}
                                threadId={threadId}
                            />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
