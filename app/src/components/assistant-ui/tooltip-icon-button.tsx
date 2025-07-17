"use client";

import { Button } from "@anole/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import cn from "@anole/ui/utils/cn";
import type { ComponentPropsWithoutRef } from "react";
import { forwardRef } from "react";

export type TooltipIconButtonProps = ComponentPropsWithoutRef<typeof Button> & {
    side?: "top" | "bottom" | "left" | "right";
    tooltip: string;
};

export const TooltipIconButton = ({
    children,
    className,
    ref,
    side = "bottom",
    tooltip,
    ...rest
}: TooltipIconButtonProps & { ref?: React.RefObject<HTMLButtonElement | null> }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" {...rest} className={cn("size-6 p-1", className)} ref={ref}>
                {children}
                <span className="sr-only">{tooltip}</span>
            </Button>
        </TooltipTrigger>
        <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
);

TooltipIconButton.displayName = "TooltipIconButton";
