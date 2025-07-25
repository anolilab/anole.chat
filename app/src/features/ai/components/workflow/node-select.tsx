"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@anole/ui/components/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import { useLingui } from "@lingui/react/macro";
import type { ReactNode } from "react";
import { useMemo } from "react";

import { NodeKind } from "../../lib/workflow/workflow.interface";
import { NodeIcon } from "./node-icon";

const unSupportedKinds: NodeKind[] = [NodeKind.Code];

export const NodeSelect = ({
    children,
    onChange,
    onOpenChange,
    open,
}: {
    children: ReactNode;
    onChange: (nodeKind: NodeKind) => void;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
}) => (
    <DropdownMenu onOpenChange={onOpenChange} open={open}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-64" side="right">
            <NodeSelectContent onChange={onChange} />
        </DropdownMenuContent>
    </DropdownMenu>
);

function NodeSelectContent({ onChange }: { onChange: (nodeKind: NodeKind) => void }) {
    const { t } = useLingui();
    const descriptions = useMemo(() => t.raw("Workflow.kindsDescription") ?? {}, [t]);

    return Object.keys(NodeKind)
        .filter((key) => NodeKind[key] !== NodeKind.Input)
        .sort((a, b) => {
            const aIndex = unSupportedKinds.indexOf(NodeKind[a]);
            const bIndex = unSupportedKinds.indexOf(NodeKind[b]);

            return aIndex - bIndex;
        })
        .map((key) => (
            <Tooltip delayDuration={0} key={key}>
                <TooltipTrigger asChild>
                    <DropdownMenuItem
                        disabled={unSupportedKinds.includes(NodeKind[key])}
                        key={key}
                        onClick={() => {
                            if (unSupportedKinds.includes(NodeKind[key])) {
                                return;
                            }

                            onChange(NodeKind[key]);
                        }}
                    >
                        <NodeIcon type={NodeKind[key]} />
                        {key}

                        {unSupportedKinds.includes(NodeKind[key]) && <span className="text-muted-foreground ml-auto text-xs">Soon...</span>}
                    </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent align="center" className="max-w-64 p-4" side="left">
                    <div className="mb-4 flex items-center gap-2">
                        <NodeIcon type={NodeKind[key]} />
                        <span className="text-foreground text-sm font-semibold">{key}</span>
                    </div>
                    <div className="whitespace-pre-wrap">{descriptions[NodeKind[key]] ?? t`Coming soon.`}</div>
                </TooltipContent>
            </Tooltip>
        ));
}
