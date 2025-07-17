import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import * as React from "react";

import cn from "../utils/cn";

const DropdownMenu = ({
    ...properties
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) => (
    <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...properties} />
);

const DropdownMenuPortal = ({
    ...properties
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) => (
    <DropdownMenuPrimitive.Portal
        data-slot="dropdown-menu-portal"
        {...properties}
    />
);

const DropdownMenuTrigger = ({
    ...properties
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) => (
    <DropdownMenuPrimitive.Trigger
        data-slot="dropdown-menu-trigger"
        {...properties}
    />
);

const DropdownMenuContent = ({
    className,
    sideOffset = 4,
    ...properties
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) => (
    <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
            className={cn(
                "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
                className,
            )}
            data-slot="dropdown-menu-content"
            sideOffset={sideOffset}
            {...properties}
        />
    </DropdownMenuPrimitive.Portal>
);

const DropdownMenuGroup = ({
    ...properties
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) => (
    <DropdownMenuPrimitive.Group
        data-slot="dropdown-menu-group"
        {...properties}
    />
);

const DropdownMenuItem = ({
    className,
    inset,
    variant = "default",
    ...properties
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
}) => (
    <DropdownMenuPrimitive.Item
        className={cn(
            "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            className,
        )}
        data-inset={inset}
        data-slot="dropdown-menu-item"
        data-variant={variant}
        {...properties}
    />
);

const DropdownMenuCheckboxItem = ({
    checked,
    children,
    className,
    ...properties
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) => (
    <DropdownMenuPrimitive.CheckboxItem
        checked={checked}
        className={cn(
            "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            className,
        )}
        data-slot="dropdown-menu-checkbox-item"
        {...properties}
    >
        <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
            <DropdownMenuPrimitive.ItemIndicator>
                <CheckIcon className="size-4" />
            </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </DropdownMenuPrimitive.CheckboxItem>
);

const DropdownMenuRadioGroup = ({
    ...properties
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) => (
    <DropdownMenuPrimitive.RadioGroup
        data-slot="dropdown-menu-radio-group"
        {...properties}
    />
);

const DropdownMenuRadioItem = ({
    children,
    className,
    ...properties
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) => (
    <DropdownMenuPrimitive.RadioItem
        className={cn(
            "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            className,
        )}
        data-slot="dropdown-menu-radio-item"
        {...properties}
    >
        <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
            <DropdownMenuPrimitive.ItemIndicator>
                <CircleIcon className="size-2 fill-current" />
            </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </DropdownMenuPrimitive.RadioItem>
);

const DropdownMenuLabel = ({
    className,
    inset,
    ...properties
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
}) => (
    <DropdownMenuPrimitive.Label
        className={cn(
            "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
            className,
        )}
        data-inset={inset}
        data-slot="dropdown-menu-label"
        {...properties}
    />
);

const DropdownMenuSeparator = ({
    className,
    ...properties
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) => (
    <DropdownMenuPrimitive.Separator
        className={cn("bg-border -mx-1 my-1 h-px", className)}
        data-slot="dropdown-menu-separator"
        {...properties}
    />
);

const DropdownMenuShortcut = ({
    className,
    ...properties
}: React.ComponentProps<"span">) => (
    <span
        className={cn(
            "text-muted-foreground ml-auto text-xs tracking-widest",
            className,
        )}
        data-slot="dropdown-menu-shortcut"
        {...properties}
    />
);

const DropdownMenuSub = ({
    ...properties
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) => (
    <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...properties} />
);

const DropdownMenuSubTrigger = ({
    children,
    className,
    inset,
    ...properties
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
}) => (
    <DropdownMenuPrimitive.SubTrigger
        className={cn(
            "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8",
            className,
        )}
        data-inset={inset}
        data-slot="dropdown-menu-sub-trigger"
        {...properties}
    >
        {children}
        <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
);

const DropdownMenuSubContent = ({
    className,
    ...properties
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) => (
    <DropdownMenuPrimitive.SubContent
        className={cn(
            "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
            className,
        )}
        data-slot="dropdown-menu-sub-content"
        {...properties}
    />
);

export {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
};
