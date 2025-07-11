import * as React from "react";

import { cn } from "@/lib/utils";

const Card = ({ className, ...properties }: React.ComponentProps<"div">) => <div className={cn("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm", className)} data-slot="card" {...properties} />;

const CardHeader = ({ className, ...properties }: React.ComponentProps<"div">) => (
    <div
        className={cn(
            "@container/card-header has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6",
            className,
        )}
        data-slot="card-header"
        {...properties}
    />
);

const CardTitle = ({ className, ...properties }: React.ComponentProps<"div">) => <div className={cn("font-semibold leading-none", className)} data-slot="card-title" {...properties} />;

const CardDescription = ({ className, ...properties }: React.ComponentProps<"div">) => <div className={cn("text-muted-foreground text-sm", className)} data-slot="card-description" {...properties} />;

const CardAction = ({ className, ...properties }: React.ComponentProps<"div">) => <div className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)} data-slot="card-action" {...properties} />;

const CardContent = ({ className, ...properties }: React.ComponentProps<"div">) => <div className={cn("px-6", className)} data-slot="card-content" {...properties} />;

const CardFooter = ({ className, ...properties }: React.ComponentProps<"div">) => <div className={cn("[.border-t]:pt-6 flex items-center px-6", className)} data-slot="card-footer" {...properties} />;

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
