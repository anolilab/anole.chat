"use client";

import { Button } from "@anole/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@anole/ui/components/dialog";
import useCopy from "@anole/ui/hooks/use-copy-to-clipboard";
import cn from "@anole/ui/utils/cn";
import { Check, Copy } from "lucide-react";
import type { ReactNode } from "react";
import { JsonView } from "react-json-view-lite";

export const JsonViewPopup = ({
    children,
    data,
    onOpenChange,
    open,
}: {
    children?: ReactNode;
    data?: any;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
}) => {
    const { copied, copy } = useCopy();

    return (
        <Dialog onOpenChange={onOpenChange} open={open}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="text-muted-foreground text-xs" size="sm" variant="ghost">
                        JSON
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-[70vw] min-w-[40vw]">
                <DialogHeader>
                    <DialogTitle>JSON</DialogTitle>
                </DialogHeader>

                <div className="flex max-h-[70vh] w-full flex-col overflow-y-auto p-6 pt-0">
                    <Button
                        className="ml-auto size-3! p-4!"
                        onClick={() => copy(typeof data === "string" ? data : JSON.stringify(data))}
                        size="icon"
                        variant="ghost"
                    >
                        {copied ? <Check /> : <Copy />}
                    </Button>
                    <JsonView data={data} />
                </div>
            </DialogContent>
        </Dialog>
    );
};
