"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import type { DialogProps } from "radix-ui";
import * as React from "react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const Command = ({
    className,
    ref,
    ...properties
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive> & { ref?: React.RefObject<React.ElementRef<typeof CommandPrimitive> | null> }) => (
    <CommandPrimitive
        className={cn("bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md", className)}
        ref={ref}
        {...properties}
    />
);

Command.displayName = CommandPrimitive.displayName;

interface CommandDialogProperties extends DialogProps {}

const CommandDialog = ({ children, ...properties }: CommandDialogProperties) => (
    <Dialog {...properties}>
        <DialogContent className="overflow-hidden p-0 shadow-lg">
            <Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
                {children}
            </Command>
        </DialogContent>
    </Dialog>
);

const CommandInput = ({
    className,
    ref,
    ...properties
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & { ref?: React.RefObject<React.ElementRef<typeof CommandPrimitive.Input> | null> }) => (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandPrimitive.Input
            className={cn(
                "placeholder:text-muted-foreground flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50",
                className,
            )}
            ref={ref}
            {...properties}
        />
    </div>
);

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = ({
    className,
    ref,
    ...properties
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.List> & { ref?: React.RefObject<React.ElementRef<typeof CommandPrimitive.List> | null> }) => (
    <CommandPrimitive.List className={cn("max-h-[300px] overflow-x-hidden overflow-y-auto", className)} ref={ref} {...properties} />
);

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = ({
    ref,
    ...properties
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty> & { ref?: React.RefObject<React.ElementRef<typeof CommandPrimitive.Empty> | null> }) => (
    <CommandPrimitive.Empty className="py-6 text-center text-sm" ref={ref} {...properties} />
);

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = ({
    className,
    ref,
    ...properties
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group> & { ref?: React.RefObject<React.ElementRef<typeof CommandPrimitive.Group> | null> }) => (
    <CommandPrimitive.Group
        className={cn(
            "text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
            className,
        )}
        ref={ref}
        {...properties}
    />
);

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = ({
    className,
    ref,
    ...properties
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator> & {
    ref?: React.RefObject<React.ElementRef<typeof CommandPrimitive.Separator> | null>;
}) => <CommandPrimitive.Separator className={cn("bg-border -mx-1 h-px", className)} ref={ref} {...properties} />;

CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = ({
    className,
    ref,
    ...properties
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> & { ref?: React.RefObject<React.ElementRef<typeof CommandPrimitive.Item> | null> }) => (
    <CommandPrimitive.Item
        className={cn(
            "data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
            className,
        )}
        ref={ref}
        {...properties}
    />
);

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...properties }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span className={cn("text-muted-foreground ml-auto text-xs tracking-widest", className)} {...properties} />
);

CommandShortcut.displayName = "CommandShortcut";

export { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut };
