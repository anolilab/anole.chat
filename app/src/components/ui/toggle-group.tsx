"use client";

import type { VariantProps } from "class-variance-authority";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import * as React from "react";

import { toggleVariants } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({
    size: "default",
    variant: "default",
});

const ToggleGroup = ({
    children,
    className,
    size,
    variant,
    ...properties
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>) => (
    <ToggleGroupPrimitive.Root
        className={cn("group/toggle-group data-[variant=outline]:shadow-xs flex w-fit items-center rounded-md", className)}
        data-size={size}
        data-slot="toggle-group"
        data-variant={variant}
        {...properties}
    >
        <ToggleGroupContext value={{ size, variant }}>{children}</ToggleGroupContext>
    </ToggleGroupPrimitive.Root>
);

const ToggleGroupItem = ({
    children,
    className,
    size,
    variant,
    ...properties
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>) => {
    const context = React.use(ToggleGroupContext);

    return (
        <ToggleGroupPrimitive.Item
            className={cn(
                toggleVariants({
                    size: context.size || size,
                    variant: context.variant || variant,
                }),
                "min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l",
                className,
            )}
            data-size={context.size || size}
            data-slot="toggle-group-item"
            data-variant={context.variant || variant}
            {...properties}
        >
            {children}
        </ToggleGroupPrimitive.Item>
    );
};

export { ToggleGroup, ToggleGroupItem };
