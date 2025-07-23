"use client";

import { Button } from "@anole/ui/components/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@anole/ui/components/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { getShortcutKeyList, isShortcutEvent, Shortcuts } from "lib/keyboard-shortcuts";
import { capitalizeFirstLetter, createDebounce } from "lib/utils";
import { Check, CheckIcon, ClipboardCheck, Infinity, PenOff, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

import { appStore } from "../store";

const debounce = createDebounce();

export const ToolModeDropdown = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useLingui();
    const [toolChoice, appStoreMutate] = appStore(useShallow((state) => [state.toolChoice, state.mutate]));
    const [open, setOpen] = useState(false);

    const [toolChoiceChangeInfo, setToolChoiceChangeInfo] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isShortcutEvent(e, Shortcuts.toolMode)) {
                e.preventDefault();
                e.stopPropagation();
                appStoreMutate(({ toolChoice }) => {
                    return {
                        toolChoice: toolChoice == "auto" ? "manual" : toolChoice == "manual" ? "none" : "auto",
                    };
                });
                setToolChoiceChangeInfo(true);
                debounce(() => {
                    setToolChoiceChangeInfo(false);
                }, 1000);
            }
        };

        globalThis.addEventListener("keydown", handleKeyDown);

        return () => globalThis.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <DropdownMenu onOpenChange={setOpen} open={open}>
            <DropdownMenuTrigger asChild disabled={disabled}>
                <div className="relative">
                    <Tooltip open={toolChoiceChangeInfo}>
                        <TooltipTrigger asChild>
                            <span className="absolute inset-0 -z-10" />
                        </TooltipTrigger>
                        <TooltipContent className="flex items-center gap-2" side="bottom">
                            {capitalizeFirstLetter(toolChoice)}
                            <CheckIcon className="size-2.5" />
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                className={cn(
                                    "data-[state=open]:bg-input! hover:bg-input! rounded-full p-2!",
                                    toolChoice == "none" && "text-muted-foreground",
                                    open && "bg-input!",
                                )}
                                onClick={() => setOpen(true)}
                                size="sm"
                                variant="ghost"
                            >
                                <Settings2 />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="flex items-center gap-2" side="top">
                            {t`selectToolMode`}
                            <span className="text-muted-foreground ml-2">{getShortcutKeyList(Shortcuts.toolMode).join("")}</span>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top">
                <DropdownMenuLabel className="text-muted-foreground flex items-center gap-2">
                    {t`selectToolMode`}
                    <DropdownMenuShortcut>
                        <span className="text-muted-foreground bg-muted rounded-md px-2 py-0.5 text-xs">{getShortcutKeyList(Shortcuts.toolMode).join("")}</span>
                    </DropdownMenuShortcut>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => appStoreMutate({ toolChoice: "auto" })}>
                        <div className="flex w-full flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Infinity />
                                <span className="font-bold">Auto</span>
                                {toolChoice == "auto" && <Check className="ml-auto" />}
                            </div>
                            <p className="text-muted-foreground text-xs">{t`autoToolModeDescription`}</p>
                        </div>
                    </DropdownMenuItem>
                    <div className="px-2 py-1">
                        <DropdownMenuSeparator />
                    </div>
                    <DropdownMenuItem onClick={() => appStoreMutate({ toolChoice: "manual" })}>
                        <div className="flex w-full flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <ClipboardCheck />
                                <span className="font-bold">Manual</span>
                                {toolChoice == "manual" && <Check className="ml-auto" />}
                            </div>
                            <p className="text-muted-foreground text-xs">{t`manualToolModeDescription`}</p>
                        </div>
                    </DropdownMenuItem>
                    <div className="px-2 py-1">
                        <DropdownMenuSeparator />
                    </div>
                    <DropdownMenuItem onClick={() => appStoreMutate({ toolChoice: "none" })}>
                        <div className="flex w-full flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <PenOff />
                                <span className="font-bold">None</span>
                                <span className="text-muted-foreground ml-4 text-xs">@mention only</span>
                                {toolChoice == "none" && <Check className="ml-auto" />}
                            </div>

                            <p className="text-muted-foreground text-xs">{t`noneToolModeDescription`}</p>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
