import * as React from "react";

import { cn } from "@/lib/utils";

const Table = ({ className, ...properties }: React.ComponentProps<"table">) => (
    <div className="relative w-full overflow-x-auto" data-slot="table-container">
        <table className={cn("w-full caption-bottom text-sm", className)} data-slot="table" {...properties} />
    </div>
);

const TableHeader = ({ className, ...properties }: React.ComponentProps<"thead">) => (
    <thead className={cn("[&_tr]:border-b", className)} data-slot="table-header" {...properties} />
);

const TableBody = ({ className, ...properties }: React.ComponentProps<"tbody">) => (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} data-slot="table-body" {...properties} />
);

const TableFooter = ({ className, ...properties }: React.ComponentProps<"tfoot">) => (
    <tfoot className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)} data-slot="table-footer" {...properties} />
);

const TableRow = ({ className, ...properties }: React.ComponentProps<"tr">) => (
    <tr className={cn("hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors", className)} data-slot="table-row" {...properties} />
);

const TableHead = ({ className, ...properties }: React.ComponentProps<"th">) => (
    <th
        className={cn(
            "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
            className,
        )}
        data-slot="table-head"
        {...properties}
    />
);

const TableCell = ({ className, ...properties }: React.ComponentProps<"td">) => (
    <td
        className={cn("p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className)}
        data-slot="table-cell"
        {...properties}
    />
);

const TableCaption = ({ className, ...properties }: React.ComponentProps<"caption">) => (
    <caption className={cn("text-muted-foreground mt-4 text-sm", className)} data-slot="table-caption" {...properties} />
);

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
