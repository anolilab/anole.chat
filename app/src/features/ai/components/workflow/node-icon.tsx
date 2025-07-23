"use client";

import cn from "@anole/ui/utils/cn";
import { BotIcon, BoxIcon, HardDriveUpload, HouseIcon, InfoIcon, LandPlotIcon, SplitIcon, TerminalIcon, TextIcon, WrenchIcon } from "lucide-react";
import { useMemo } from "react";

import { NodeKind } from "../../lib/workflow/workflow.interface";

export const NodeIcon = ({ className, iconClassName, type }: { className?: string; iconClassName?: string; type: NodeKind }) => {
    const Icon = useMemo(() => {
        switch (type) {
            case NodeKind.Code: {
                return TerminalIcon;
            }
            case NodeKind.Condition: {
                return SplitIcon;
            }
            case NodeKind.Http: {
                return HardDriveUpload;
            }
            case NodeKind.Input: {
                return HouseIcon;
            }
            case NodeKind.LLM: {
                return BotIcon;
            }
            case NodeKind.Note: {
                return InfoIcon;
            }
            case NodeKind.Output: {
                return LandPlotIcon;
            }
            case NodeKind.Template: {
                return TextIcon;
            }
            case NodeKind.Tool: {
                return WrenchIcon;
            }
            default: {
                return BoxIcon;
            }
        }
    }, [type]);

    return (
        <div
            className={cn(
                type === NodeKind.Input
                    ? "bg-blue-500"
                    : type === NodeKind.Output
                        ? "bg-green-500"
                        : type === NodeKind.Note
                            ? "text-foreground bg-input"
                            : type === NodeKind.LLM
                                ? "bg-indigo-500"
                                : type === NodeKind.Tool
                                    ? "bg-blue-500"
                                    : type === NodeKind.Code || type === NodeKind.Http
                                        ? "bg-rose-500"
                                        : type === NodeKind.Template
                                            ? "bg-purple-500"
                                            : type === NodeKind.Condition
                                                ? "bg-amber-500"
                                                : "bg-card",
                "rounded p-1",
                className,
            )}
        >
            <Icon className={cn("size-4 text-white", iconClassName)} />
        </div>
    );
};
