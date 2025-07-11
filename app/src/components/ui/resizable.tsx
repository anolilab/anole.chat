import { GripVerticalIcon } from "lucide-react";
import * as React from "react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({ className, ...properties }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
    <ResizablePrimitive.PanelGroup
        className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
        data-slot="resizable-panel-group"
        {...properties}
    />
);

const ResizablePanel = ({ ...properties }: React.ComponentProps<typeof ResizablePrimitive.Panel>) => <ResizablePrimitive.Panel data-slot="resizable-panel" {...properties} />;

const ResizableHandle = ({
    className,
    withHandle,
    ...properties
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
    withHandle?: boolean;
}) => (
    <ResizablePrimitive.PanelResizeHandle
        className={cn(
            "bg-border focus-visible:ring-ring focus-visible:outline-hidden relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
            className,
        )}
        data-slot="resizable-handle"
        {...properties}
    >
        {withHandle && (
            <div className="bg-border rounded-xs z-10 flex h-4 w-3 items-center justify-center border">
                <GripVerticalIcon className="size-2.5" />
            </div>
        )}
    </ResizablePrimitive.PanelResizeHandle>
);

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
