"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import * as React from "react";

import cn from "../utils/cn";

const Switch = ({
    className,
    ...properties
}: React.ComponentProps<typeof SwitchPrimitive.Root>) => (
    <SwitchPrimitive.Root
        className={cn(
            "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
            className,
        )}
        data-slot="switch"
        {...properties}
    >
        <SwitchPrimitive.Thumb
            className={cn(
                "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
            )}
            data-slot="switch-thumb"
        />
    </SwitchPrimitive.Root>
);

export { Switch };
