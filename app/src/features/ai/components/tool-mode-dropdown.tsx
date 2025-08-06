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
// import { getShortcutKeyList, isShortcutEvent, Shortcuts } from "lib/keyboard-shortcuts";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { Check, CheckIcon, ClipboardCheck, Infinity as InfinityIcon, PenOff, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

import { appStore } from "../store";

const capitalizeFirstLetter = (string_: string): string => string_.charAt(0).toUpperCase() + string_.slice(1);

const ToolModeDropdown = ({ disabled }: { disabled?: boolean }): JSX.Element => {
    const { t } = useLingui();
    const [toolChoice, appStoreMutate] = appStore(useShallow((state) => [state.toolChoice, state.mutate]));
    const [open, setOpen] = useState(false);

    // Show info immediately, then auto-hide after 1000ms
    const [showInfo, setShowInfo] = useState(false);
    const [toolChoiceChangeInfo] = useDebouncedValue(showInfo, { wait: 1000 });

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            /*
            if (isShortcutEvent(event, Shortcuts.toolMode)) {
                event.preventDefault();
                event.stopPropagation();
                appStoreMutate(({ toolChoice: previousToolChoice }) => {
                    let nextToolChoice: typeof previousToolChoice;
                    if (previousToolChoice === "auto") nextToolChoice = "manual";
                    else if (previousToolChoice === "manual") nextToolChoice = "none";
                    else nextToolChoice = "auto";
                    return { toolChoice: nextToolChoice };
                });
                setShowInfo(true);
            }
            */
        };

        globalThis.addEventListener("keydown", handleKeyDown);

        return () => globalThis.removeEventListener("keydown", handleKeyDown);
    }, [appStoreMutate]);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | undefined;

        if (!toolChoiceChangeInfo && showInfo) {
            timeout = setTimeout(() => setShowInfo(false), 0);
        }

        return () => {
            if (timeout)
                clearTimeout(timeout);
        };
    }, [toolChoiceChangeInfo, showInfo]);

    // Move onClick handlers out of JSX
    const handleAutoClick = () => appStoreMutate({ toolChoice: "auto" });
    const handleManualClick = () => appStoreMutate({ toolChoice: "manual" });
    const handleNoneClick = () => appStoreMutate({ toolChoice: "none" });
    const handleOpenClick = () => setOpen(true);

    return (
        <DropdownMenu onOpenChange={setOpen} open={open}>
            <DropdownMenuTrigger asChild disabled={disabled}>
                <div className="relative">
                    <Tooltip open={toolChoiceChangeInfo}>
                        <TooltipTrigger asChild>
                            <span className="absolute inset-0 -z-10" />
                        </TooltipTrigger>
                        <TooltipContent className="flex items-center gap-2">
                            {capitalizeFirstLetter(toolChoice)}
                            <CheckIcon className="size-2.5" />
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                className={cn(
                                    "data-[state=open]:bg-input! hover:bg-input! rounded-full p-2!",
                                    toolChoice === "none" && "text-muted-foreground",
                                    open && "bg-input!",
                                )}
                                onClick={handleOpenClick}
                                size="sm"
                                variant="ghost"
                            >
                                <Settings2 />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="flex items-center gap-2" side="top">
                            {t`Select a tool mode`}
                            <span className="text-muted-foreground ml-2">{/* getShortcutKeyList(Shortcuts.toolMode).join("") */}</span>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top">
                <DropdownMenuLabel className="text-muted-foreground flex items-center gap-2">
                    {t`Select a tool mode`}
                    <DropdownMenuShortcut>
                        <span className="text-muted-foreground bg-muted rounded-md px-2 py-0.5 text-xs">
                            {/* getShortcutKeyList(Shortcuts.toolMode).join("") */}
                        </span>
                    </DropdownMenuShortcut>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={handleAutoClick}>
                        <div className="flex w-full flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <InfinityIcon />
                                <span className="font-bold">Auto</span>
                                {toolChoice === "auto" && <Check className="ml-auto" />}
                            </div>
                            <p className="text-muted-foreground text-xs">{t`Decides when to use tools without asking you`}</p>
                        </div>
                    </DropdownMenuItem>
                    <div className="px-2 py-1">
                        <DropdownMenuSeparator />
                    </div>
                    <DropdownMenuItem onClick={handleManualClick}>
                        <div className="flex w-full flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <ClipboardCheck />
                                <span className="font-bold">Manual</span>
                                {toolChoice === "manual" && <Check className="ml-auto" />}
                            </div>
                            <p className="text-muted-foreground text-xs">{t`Asks your permission before using any tools`}</p>
                        </div>
                    </DropdownMenuItem>
                    <div className="px-2 py-1">
                        <DropdownMenuSeparator />
                    </div>
                    <DropdownMenuItem onClick={handleNoneClick}>
                        <div className="flex w-full flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <PenOff />
                                <span className="font-bold">None</span>
                                <span className="text-muted-foreground ml-4 text-xs">@mention only</span>
                                {toolChoice === "none" && <Check className="ml-auto" />}
                            </div>

                            <p className="text-muted-foreground text-xs">{t`Do not use tools. @mention is still available.`}</p>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ToolModeDropdown;
