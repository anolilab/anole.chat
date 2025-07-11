"use client";

import { Avatar as AvatarPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

const Avatar = ({ className, ...properties }: React.ComponentProps<typeof AvatarPrimitive.Root>) => <AvatarPrimitive.Root className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)} data-slot="avatar" {...properties} />;

const AvatarImage = ({ className, ...properties }: React.ComponentProps<typeof AvatarPrimitive.Image>) => <AvatarPrimitive.Image className={cn("aspect-square size-full", className)} data-slot="avatar-image" {...properties} />;

const AvatarFallback = ({ className, ...properties }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) => (
    <AvatarPrimitive.Fallback
        className={cn("bg-muted flex size-full items-center justify-center rounded-full", className)}
        data-slot="avatar-fallback"
        {...properties}
    />
);

export { Avatar, AvatarFallback, AvatarImage };
