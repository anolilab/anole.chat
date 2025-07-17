"use client";

import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { ContextMenu as ContextMenuPrimitive } from "radix-ui";
import * as React from "react";

import cn from "../utils/cn";

const ContextMenu = ({
    ...properties
}: React.ComponentProps<typeof ContextMenuPrimitive.Root>) => (
    <ContextMenuPrimitive.Root data-slot="context-menu" {...properties} />
);

const ContextMenuTrigger = ({
    ...properties
}: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) => (
    <ContextMenuPrimitive.Trigger
        data-slot="context-menu-trigger"
        {...properties}
    />
);

const ContextMenuGroup = ({
    ...properties
}: React.ComponentProps<typeof ContextMenuPrimitive.Group>) => (
    <ContextMenuPrimitive.Group
        data-slot="context-menu-group"
        {...properties}
    />
);

const ContextMenuPortal = ({
    ...properties
}: React.ComponentProps<typeof ContextMenuPrimitive.Portal>) => (
    <ContextMenuPrimitive.Portal
        data-slot="context-menu-portal"
        {...properties}
    />
);

const ContextMenuSub = ({
    ...properties
}: React.ComponentProps<typeof ContextMenuPrimitive.Sub>) => (
    <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...properties} />
);

const ContextMenuRadioGroup = ({
    ...properties
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioGroup>) => (
    <ContextMenuPrimitive.RadioGroup
        data-slot="context-menu-radio-group"
        {...properties}
    />
);

const ContextMenuSubTrigger = ({
    children,
    className,
    inset,
    ...properties
}: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean;
}) => (
    <ContextMenuPrimitive.SubTrigger
        className={cn(
            "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            className,
        )}
        data-inset={inset}
        data-slot="context-menu-sub-trigger"
        {...properties}
    >
        {children}
        <ChevronRightIcon className="ml-auto" />
    </ContextMenuPrimitive.SubTrigger>
);

const ContextMenuSubContent = ({
    className,
    ...properties
}: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>) => (
    <ContextMenuPrimitive.SubContent
        className={cn(
            "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
            className,
        )}
        data-slot="context-menu-sub-content"
        {...properties}
    />
);

const ContextMenuContent = ({
    className,
    ...properties
}: React.ComponentProps<typeof ContextMenuPrimitive.Content>) => (
    <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content
            className={cn(
                "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
                className,
            )}
            data-slot="context-menu-content"
            {...properties}
        />
    </ContextMenuPrimitive.Portal>
);

const ContextMenuItem = ({
    className,
    inset,
    variant = "default",
    ...properties
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
}) => (
    <ContextMenuPrimitive.Item
        className={cn(
            "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            className,
        )}
        data-inset={inset}
        data-slot="context-menu-item"
        data-variant={variant}
        {...properties}
    />
);

const ContextMenuCheckboxItem = ({
    checked,
    children,
    className,
    ...properties
}: React.ComponentProps<typeof ContextMenuPrimitive.CheckboxItem>) => (
    <ContextMenuPrimitive.CheckboxItem
        checked={checked}
        className={cn(
            "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            className,
        )}
        data-slot="context-menu-checkbox-item"
        {...properties}
    >
        <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
            <ContextMenuPrimitive.ItemIndicator>
                <CheckIcon className="size-4" />
            </ContextMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </ContextMenuPrimitive.CheckboxItem>
);

const ContextMenuRadioItem = ({
    children,
    className,
    ...properties
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioItem>) => (
    <ContextMenuPrimitive.RadioItem
        className={cn(
            "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            className,
        )}
        data-slot="context-menu-radio-item"
        {...properties}
    >
        <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
            <ContextMenuPrimitive.ItemIndicator>
                <CircleIcon className="size-2 fill-current" />
            </ContextMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </ContextMenuPrimitive.RadioItem>
);

const ContextMenuLabel = ({
    className,
    inset,
    ...properties
}: React.ComponentProps<typeof ContextMenuPrimitive.Label> & {
    inset?: boolean;
}) => (
    <ContextMenuPrimitive.Label
        className={cn(
            "text-foreground px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
            className,
        )}
        data-inset={inset}
        data-slot="context-menu-label"
        {...properties}
    />
);

const ContextMenuSeparator = ({
    className,
    ...properties
}: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) => (
    <ContextMenuPrimitive.Separator
        className={cn("bg-border -mx-1 my-1 h-px", className)}
        data-slot="context-menu-separator"
        {...properties}
    />
);

const ContextMenuShortcut = ({
    className,
    ...properties
}: React.ComponentProps<"span">) => (
    <span
        className={cn(
            "text-muted-foreground ml-auto text-xs tracking-widest",
            className,
        )}
        data-slot="context-menu-shortcut"
        {...properties}
    />
);

export {
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuGroup,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuPortal,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
};
