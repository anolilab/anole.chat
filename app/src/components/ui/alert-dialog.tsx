"use client";

import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import * as React from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = ({
    className,
    ref,
    ...properties
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay> & {
    ref?: React.RefObject<React.ElementRef<typeof AlertDialogPrimitive.Overlay> | null>;
}) => (
    <AlertDialogPrimitive.Overlay
        className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80",
            className,
        )}
        {...properties}
        ref={ref}
    />
);

AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = ({
    className,
    ref,
    ...properties
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & {
    ref?: React.RefObject<React.ElementRef<typeof AlertDialogPrimitive.Content> | null>;
}) => (
    <AlertDialogPortal>
        <AlertDialogOverlay />
        <AlertDialogPrimitive.Content
            className={cn(
                "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100%-4rem)] w-full -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto border p-6 shadow-lg shadow-black/5 duration-200 sm:max-w-[400px] sm:rounded-xl",
                className,
            )}
            ref={ref}
            {...properties}
        />
    </AlertDialogPortal>
);

AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({ className, ...properties }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-1 text-center sm:text-left", className)} {...properties} />
);

AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({ className, ...properties }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3", className)} {...properties} />
);

AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = ({
    className,
    ref,
    ...properties
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title> & {
    ref?: React.RefObject<React.ElementRef<typeof AlertDialogPrimitive.Title> | null>;
}) => <AlertDialogPrimitive.Title className={cn("text-lg font-semibold", className)} ref={ref} {...properties} />;

AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = ({
    className,
    ref,
    ...properties
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description> & {
    ref?: React.RefObject<React.ElementRef<typeof AlertDialogPrimitive.Description> | null>;
}) => <AlertDialogPrimitive.Description className={cn("text-muted-foreground text-sm", className)} ref={ref} {...properties} />;

AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = ({
    className,
    ref,
    ...properties
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & {
    ref?: React.RefObject<React.ElementRef<typeof AlertDialogPrimitive.Action> | null>;
}) => <AlertDialogPrimitive.Action className={cn(buttonVariants(), className)} ref={ref} {...properties} />;

AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = ({
    className,
    ref,
    ...properties
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> & {
    ref?: React.RefObject<React.ElementRef<typeof AlertDialogPrimitive.Cancel> | null>;
}) => <AlertDialogPrimitive.Cancel className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className)} ref={ref} {...properties} />;

AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    AlertDialogPortal,
    AlertDialogTitle,
    AlertDialogTrigger,
};
