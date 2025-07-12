import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import * as React from "react";

import type { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Pagination = ({ className, ...properties }: React.ComponentProps<"nav">) => (
    <nav aria-label="pagination" className={cn("mx-auto flex w-full justify-center", className)} data-slot="pagination" role="navigation" {...properties} />
);

const PaginationContent = ({ className, ...properties }: React.ComponentProps<"ul">) => (
    <ul className={cn("flex flex-row items-center gap-1", className)} data-slot="pagination-content" {...properties} />
);

const PaginationItem = ({ ...properties }: React.ComponentProps<"li">) => <li data-slot="pagination-item" {...properties} />;

type PaginationLinkProperties = Pick<React.ComponentProps<typeof Button>, "size">
    & React.ComponentProps<"a"> & {
        isActive?: boolean;
    };

const PaginationLink = ({ className, isActive, size = "icon", ...properties }: PaginationLinkProperties) => (
    <a
        aria-current={isActive ? "page" : undefined}
        className={cn(
            buttonVariants({
                size,
                variant: isActive ? "outline" : "ghost",
            }),
            className,
        )}
        data-active={isActive}
        data-slot="pagination-link"
        {...properties}
    />
);

const PaginationPrevious = ({ className, ...properties }: React.ComponentProps<typeof PaginationLink>) => (
    <PaginationLink aria-label="Go to previous page" className={cn("gap-1 px-2.5 sm:pl-2.5", className)} size="default" {...properties}>
        <ChevronLeftIcon />
        <span className="hidden sm:block">Previous</span>
    </PaginationLink>
);

const PaginationNext = ({ className, ...properties }: React.ComponentProps<typeof PaginationLink>) => (
    <PaginationLink aria-label="Go to next page" className={cn("gap-1 px-2.5 sm:pr-2.5", className)} size="default" {...properties}>
        <span className="hidden sm:block">Next</span>
        <ChevronRightIcon />
    </PaginationLink>
);

const PaginationEllipsis = ({ className, ...properties }: React.ComponentProps<"span">) => (
    <span aria-hidden className={cn("flex size-9 items-center justify-center", className)} data-slot="pagination-ellipsis" {...properties}>
        <MoreHorizontalIcon className="size-4" />
        <span className="sr-only">More pages</span>
    </span>
);

export { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious };
