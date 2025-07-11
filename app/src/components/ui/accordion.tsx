import { ChevronDownIcon } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

const Accordion = ({ ...properties }: React.ComponentProps<typeof AccordionPrimitive.Root>) => <AccordionPrimitive.Root data-slot="accordion" {...properties} />;

const AccordionItem = ({ className, ...properties }: React.ComponentProps<typeof AccordionPrimitive.Item>) => <AccordionPrimitive.Item className={cn("border-b last:border-b-0", className)} data-slot="accordion-item" {...properties} />;

const AccordionTrigger = ({ children, className, ...properties }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) => (
    <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
            className={cn(
                "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium outline-none transition-all hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
                className,
            )}
            data-slot="accordion-trigger"
            {...properties}
        >
            {children}
            <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
        </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
);

const AccordionContent = ({ children, className, ...properties }: React.ComponentProps<typeof AccordionPrimitive.Content>) => (
    <AccordionPrimitive.Content
        className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
        data-slot="accordion-content"
        {...properties}
    >
        <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </AccordionPrimitive.Content>
);

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
