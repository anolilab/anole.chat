"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

const Tabs = ({ className, ...properties }: React.ComponentProps<typeof TabsPrimitive.Root>) => (
    <TabsPrimitive.Root className={cn("flex flex-col gap-2", className)} data-slot="tabs" {...properties} />
);

const TabsList = ({ className, ...properties }: React.ComponentProps<typeof TabsPrimitive.List>) => (
    <TabsPrimitive.List
        className={cn("bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]", className)}
        data-slot="tabs-list"
        {...properties}
    />
);

const TabsTrigger = ({ className, ...properties }: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
    <TabsPrimitive.Trigger
        className={cn(
            "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 py-1 text-sm font-medium transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
            className,
        )}
        data-slot="tabs-trigger"
        {...properties}
    />
);

const TabsContent = ({ className, ...properties }: React.ComponentProps<typeof TabsPrimitive.Content>) => (
    <TabsPrimitive.Content className={cn("flex-1 outline-none", className)} data-slot="tabs-content" {...properties} />
);

export { Tabs, TabsContent, TabsList, TabsTrigger };
