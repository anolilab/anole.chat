"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@anole/ui/components/avatar";
import { Button } from "@anole/ui/components/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@anole/ui/components/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@anole/ui/components/dropdown-menu";
import { Input } from "@anole/ui/components/input";
import { Label } from "@anole/ui/components/label";
import { handleErrorWithToast } from "@anole/ui/components/shared-toast";
import { Textarea } from "@anole/ui/components/textarea";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { safe } from "ts-safe";
import { z } from "zod/v4";

import { useObjectState } from "@/hooks/use-object-state";
import type { DBWorkflow, WorkflowIcon } from "@/types/workflow";

const BACKGROUND_COLORS = [
    "oklch(87% 0 0)",
    "oklch(20.5% 0 0)",
    "oklch(80.8% 0.114 19.571)",
    "oklch(83.7% 0.128 66.29)",
    "oklch(84.5% 0.143 164.978)",
    "oklch(82.8% 0.111 230.318)",
    "oklch(78.5% 0.115 274.713)",
    "oklch(81% 0.117 11.638)",
    "oklch(81% 0.117 11.638)",
];

const defaultConfig = {
    description: "",
    icon: {
        style: {
            backgroundColor: BACKGROUND_COLORS[0],
        },
        type: "emoji",
        value: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f916.png",
    } as WorkflowIcon,
    id: undefined as string | undefined,
    name: "",
};

const zodSchema = z
    .object({
        description: z.string().max(200).optional(),
        icon: z
            .object({
                style: z
                    .object({
                        backgroundColor: z.string().min(1),
                    })
                    .optional(),
                type: z.enum(["emoji"]),
                value: z.string().min(1),
            })
            .strict(),
        id: z.string().optional(),
        name: z
            .string()
            .min(1)
            .regex(/^[a-z -]+$/i),
    })
    .strict();

export const EditWorkflowPopup = ({
    children,
    defaultValue,
    onOpenChange,
    open,
    submitAfterRoute = true,
}: {
    children?: React.ReactNode;
    defaultValue?: Pick<DBWorkflow, "id" | "name" | "description" | "icon">;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
    submitAfterRoute?: boolean;
}) => {
    const { t } = useLingui();
    const { theme } = useTheme();

    const getInitialConfig = () =>
        (defaultValue
            ? {
                description: defaultValue.description || "",
                icon: defaultValue.icon || defaultConfig.icon,
                id: defaultValue.id || "",
                name: defaultValue.name || "",
            }
            : { ...defaultConfig });

    const [config, setConfig] = useObjectState<typeof defaultConfig>(getInitialConfig());

    const router = useRouter();

    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        toast.promise(
            safe(() => zodSchema.parse(config))
                .map(async (body) => {
                    const response = await fetch("/api/workflow", {
                        body: JSON.stringify(body),
                        method: "POST",
                    });
                    const data = await response.json();

                    return data as DBWorkflow;
                })
                .ifOk((workflow) => {
                    onOpenChange?.(false);
                    mutate("/api/workflow");

                    if (submitAfterRoute) {
                        router.push(`/workflow/${workflow.id}`);
                    }
                })
                .ifFail(handleErrorWithToast)
                .watch(() => setLoading(false))
                .unwrap(),
            {
                loading: t`Common.saving`,
                success: t`Common.success`,
            },
        );
    };

    return (
        <Dialog
            onOpenChange={(open) => {
                !open && setConfig(getInitialConfig());
                onOpenChange?.(open);
            }}
            open={open}
        >
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="p-2 pb-0 md:p-10">
                <DialogHeader className={cn("mb-4", config.id && "sr-only")}>
                    <DialogTitle>{t`Workflow.createWorkflow`}</DialogTitle>
                    <DialogDescription asChild>
                        <div className="mt-2">
                            <p>{t`Workflow.createWorkflowDescription`}</p>
                            <p className="mt-1">{t`Workflow.workflowDescription`}</p>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex h-full w-full gap-10">
                    {/* Left: Form */}
                    <div className="flex w-full flex-col justify-center gap-6">
                        <div className="flex gap-2">
                            <div className="flex flex-1 flex-col gap-2">
                                <Label htmlFor="workflow-name">{t`Workflow.nameAndIcon`}</Label>
                                <Input
                                    autoFocus
                                    className="bg-input border-transparent"
                                    id="workflow-name"
                                    onChange={(e) => setConfig({ name: e.target.value })}
                                    placeholder={t`Workflow.workflowNamePlaceholder`}
                                    value={config.name}
                                />
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div
                                        className="hover:bg-secondary! group ring-background hover:ring-ring flex h-14 w-14 cursor-pointer items-center justify-center rounded-lg ring transition-colors"
                                        style={{
                                            backgroundColor: config.icon.style?.backgroundColor,
                                        }}
                                    >
                                        <Avatar>
                                            <AvatarImage className="transition-transform group-hover:scale-110" src={config.icon.value} />
                                            <AvatarFallback />
                                        </Avatar>
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="flex flex-col gap-2 border-none bg-transparent p-0">
                                    <div className="bg-secondary flex gap-2 rounded-xl border p-4">
                                        {BACKGROUND_COLORS.map((color, index) => (
                                            <div
                                                className="h-6 w-6 cursor-pointer rounded"
                                                key={index}
                                                onClick={() => {
                                                    setConfig({
                                                        icon: {
                                                            ...config.icon,
                                                            style: { backgroundColor: color },
                                                        },
                                                    });
                                                }}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                    <EmojiPicker
                                        className="fade-300"
                                        lazyLoadEmojis
                                        onEmojiClick={(emoji) => {
                                            setConfig({
                                                icon: {
                                                    ...config.icon,
                                                    value: emoji.imageUrl,
                                                },
                                            });
                                        }}
                                        open
                                        theme={theme == "dark" ? Theme.DARK : Theme.LIGHT}
                                    />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label className="flex items-center gap-1" htmlFor="workflow-description">
                                {t`Workflow.description`}
                                <span className="text-muted-foreground text-xs">{t`Common.optional`}</span>
                            </Label>
                            <Textarea
                                className="bg-input min-h-[100px] resize-none border-transparent"
                                id="workflow-description"
                                onChange={(e) => setConfig({ description: e.target.value })}
                                placeholder={t`Workflow.descriptionPlaceholder`}
                                value={config.description}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">{t`Common.cancel`}</Button>
                    </DialogClose>
                    <Button disabled={loading} onClick={handleSubmit}>
                        {t`Common.save`}
                        {loading && <Loader className="size-3.5 animate-spin" />}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
