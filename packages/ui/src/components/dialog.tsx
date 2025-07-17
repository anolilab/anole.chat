"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";

import cn from "../utils/cn";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = ({
    className,
    ref,
    ...properties
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
    ref?: React.RefObject<React.ElementRef<
        typeof DialogPrimitive.Overlay
    > | null>;
}) => (
    <DialogPrimitive.Overlay
        className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80",
            className,
        )}
        ref={ref}
        {...properties}
    />
);

DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = ({
    children,
    className,
    ref,
    ...properties
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    ref?: React.RefObject<React.ElementRef<
        typeof DialogPrimitive.Content
    > | null>;
}) => (
    <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
            className={cn(
                "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg",
                className,
            )}
            ref={ref}
            {...properties}
        >
            {children}
            <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </DialogPortal>
);

DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
    className,
    ...properties
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col space-y-1.5 text-center sm:text-left",
            className,
        )}
        {...properties}
    />
);

DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
    className,
    ...properties
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
            className,
        )}
        {...properties}
    />
);

DialogFooter.displayName = "DialogFooter";

const DialogTitle = ({
    className,
    ref,
    ...properties
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & {
    ref?: React.RefObject<React.ElementRef<
        typeof DialogPrimitive.Title
    > | null>;
}) => (
    <DialogPrimitive.Title
        className={cn(
            "text-lg leading-none font-semibold tracking-tight",
            className,
        )}
        ref={ref}
        {...properties}
    />
);

DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = ({
    className,
    ref,
    ...properties
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> & {
    ref?: React.RefObject<React.ElementRef<
        typeof DialogPrimitive.Description
    > | null>;
}) => (
    <DialogPrimitive.Description
        className={cn("text-muted-foreground text-sm", className)}
        ref={ref}
        {...properties}
    />
);

DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
};
