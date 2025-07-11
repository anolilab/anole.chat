"use client";

import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import * as React from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AlertDialog = ({ ...properties }: React.ComponentProps<typeof AlertDialogPrimitive.Root>) => <AlertDialogPrimitive.Root data-slot="alert-dialog" {...properties} />;

const AlertDialogTrigger = ({ ...properties }: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) => <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...properties} />;

const AlertDialogPortal = ({ ...properties }: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) => <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...properties} />;

const AlertDialogOverlay = ({ className, ...properties }: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) => (
    <AlertDialogPrimitive.Overlay
        className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
            className,
        )}
        data-slot="alert-dialog-overlay"
        {...properties}
    />
);

const AlertDialogContent = ({ className, ...properties }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) => (
    <AlertDialogPortal>
        <AlertDialogOverlay />
        <AlertDialogPrimitive.Content
            className={cn(
                "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
                className,
            )}
            data-slot="alert-dialog-content"
            {...properties}
        />
    </AlertDialogPortal>
);

const AlertDialogHeader = ({ className, ...properties }: React.ComponentProps<"div">) => <div className={cn("flex flex-col gap-2 text-center sm:text-left", className)} data-slot="alert-dialog-header" {...properties} />;

const AlertDialogFooter = ({ className, ...properties }: React.ComponentProps<"div">) => <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} data-slot="alert-dialog-footer" {...properties} />;

const AlertDialogTitle = ({ className, ...properties }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) => <AlertDialogPrimitive.Title className={cn("text-lg font-semibold", className)} data-slot="alert-dialog-title" {...properties} />;

const AlertDialogDescription = ({ className, ...properties }: React.ComponentProps<typeof AlertDialogPrimitive.Description>) => <AlertDialogPrimitive.Description className={cn("text-muted-foreground text-sm", className)} data-slot="alert-dialog-description" {...properties} />;

const AlertDialogAction = ({ className, ...properties }: React.ComponentProps<typeof AlertDialogPrimitive.Action>) => <AlertDialogPrimitive.Action className={cn(buttonVariants(), className)} {...properties} />;

const AlertDialogCancel = ({ className, ...properties }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) => <AlertDialogPrimitive.Cancel className={cn(buttonVariants({ variant: "outline" }), className)} {...properties} />;

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
