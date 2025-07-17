"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import * as React from "react";

import cn from "../utils/cn";

const TooltipProvider = ({
    delayDuration = 0,
    ...properties
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) => (
    // eslint-disable-next-line react-x/no-context-provider
    <TooltipPrimitive.Provider
        data-slot="tooltip-provider"
        delayDuration={delayDuration}
        {...properties}
    />
);

const Tooltip = ({
    ...properties
}: React.ComponentProps<typeof TooltipPrimitive.Root>) => (
    <TooltipProvider>
        <TooltipPrimitive.Root data-slot="tooltip" {...properties} />
    </TooltipProvider>
);

const TooltipTrigger = ({
    ...properties
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) => (
    <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...properties} />
);

const TooltipContent = ({
    children,
    className,
    sideOffset = 0,
    ...properties
}: React.ComponentProps<typeof TooltipPrimitive.Content>) => (
    <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
            className={cn(
                "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
                className,
            )}
            data-slot="tooltip-content"
            sideOffset={sideOffset}
            {...properties}
        >
            {children}
            <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
        </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
);

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
