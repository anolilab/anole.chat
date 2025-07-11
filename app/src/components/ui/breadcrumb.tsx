import { ChevronRight, MoreHorizontal } from "lucide-react";
import { Slot as SlotPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

const Breadcrumb = ({ ...properties }: React.ComponentProps<"nav">) => <nav aria-label="breadcrumb" data-slot="breadcrumb" {...properties} />;

const BreadcrumbList = ({ className, ...properties }: React.ComponentProps<"ol">) => (
    <ol
        className={cn("text-muted-foreground flex flex-wrap items-center gap-1.5 break-words text-sm sm:gap-2.5", className)}
        data-slot="breadcrumb-list"
        {...properties}
    />
);

const BreadcrumbItem = ({ className, ...properties }: React.ComponentProps<"li">) => <li className={cn("inline-flex items-center gap-1.5", className)} data-slot="breadcrumb-item" {...properties} />;

const BreadcrumbLink = ({
    asChild,
    className,
    ...properties
}: React.ComponentProps<"a"> & {
    asChild?: boolean;
}) => {
    const Comp = asChild ? SlotPrimitive.Slot : "a";

    return <Comp className={cn("hover:text-foreground", className)} data-slot="breadcrumb-link" {...properties} />;
};

const BreadcrumbPage = ({ className, ...properties }: React.ComponentProps<"span">) => (
    <span
        aria-current="page"
        aria-disabled="true"
        className={cn("text-foreground font-normal", className)}
        data-slot="breadcrumb-page"
        role="link"
        {...properties}
    />
);

const BreadcrumbSeparator = ({ children, className, ...properties }: React.ComponentProps<"li">) => (
    <li aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} data-slot="breadcrumb-separator" role="presentation" {...properties}>
        {children ?? <ChevronRight />}
    </li>
);

const BreadcrumbEllipsis = ({ className, ...properties }: React.ComponentProps<"span">) => (
    <span
        aria-hidden="true"
        className={cn("flex size-9 items-center justify-center", className)}
        data-slot="breadcrumb-ellipsis"
        role="presentation"
        {...properties}
    >
        <MoreHorizontal className="size-4" />
        <span className="sr-only">More</span>
    </span>
);

export { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator };
