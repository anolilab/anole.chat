"use client";

import { Alert, AlertDescription, AlertTitle } from "@anole/ui/components/alert";
import { Badge } from "@anole/ui/components/badge";
import { Button } from "@anole/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@anole/ui/components/dialog";
import useCopy from "@anole/ui/hooks/use-copy-to-clipboard";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { CheckIcon, CopyIcon, Loader2Icon, TriangleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { JsonView } from "react-json-view-lite";

import { errorToString } from "@/lib/utils";

import type { NodeRuntimeHistory } from "../../lib/workflow/workflow.interface";

export const NodeResultPopup = ({
    children,
    disabled,
    history,
}: {
    children: ReactNode;
    disabled?: boolean;
    history: Pick<NodeRuntimeHistory, "name" | "status" | "startedAt" | "endedAt" | "error" | "result">;
}) => {
    const { copied, copy } = useCopy();
    const { t } = useLingui();

    const [tab, setTab] = useState<"input" | "output">("output");

    const duration = useMemo(() => {
        if (history.endedAt) {
            return `${((history.endedAt - history.startedAt) / 1000).toFixed(3)}s`;
        }

        return null;
    }, [history.endedAt, history.startedAt]);

    return (
        <Dialog open={disabled ? false : undefined}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="flex h-[70vh] max-w-[40vw] min-w-[40vw] flex-col overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">{history.name}</DialogTitle>
                    <DialogDescription className="sr-only">{t`Result`}</DialogDescription>
                </DialogHeader>
                <div className="flex w-full flex-1 flex-col">
                    <div className="my-8 flex items-center gap-12 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-2">{t`Status`}</p>
                            <Badge
                                className="font-semibold"
                                variant={history.status === "fail" ? "destructive" : history.status === "running" ? "secondary" : "default"}
                            >
                                {history.status === "fail"
                                    ? (
                                        <TriangleAlertIcon className="size-3" />
                                    )
                                    : history.status === "running"
                                        ? (
                                            <Loader2Icon className="size-3 animate-spin" />
                                        )
                                        : (
                                            <CheckIcon className="size-3" />
                                        )}
                                {history.status}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-2">{t`Started At`}</p>
                            <p>{new Date(history.startedAt).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-2">{t`Duration`}</p>
                            <p>{history.status === "running" ? "N/A" : duration}</p>
                        </div>
                    </div>
                    <div className="flex h-full w-full flex-col gap-2">
                        <div className="relative flex items-center">
                            <div className="pointer-events-none absolute top-0 left-0 h-full w-full border-b" />
                            <Button
                                className={cn("rounded-none", tab === "input" && "border-primary border-b")}
                                key="input"
                                onClick={() => setTab("input")}
                                variant="ghost"
                            >
                                input
                            </Button>
                            <Button
                                className={cn("rounded-none", tab === "output" && "border-primary border-b")}
                                key="output"
                                onClick={() => setTab("output")}
                                variant="ghost"
                            >
                                output
                            </Button>
                        </div>
                        <div className="flex w-full min-w-0 flex-col gap-2 p-4 pt-2">
                            {tab === "output" && history.status === "fail"
                                ? null
                                : (
                                    <>
                                        <Button
                                            className="ml-auto"
                                            onClick={() => copy(JSON.stringify(tab === "input" ? history.result?.input : history.result?.output))}
                                            size="icon"
                                            variant="ghost"
                                        >
                                            {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
                                        </Button>
                                    </>
                                )}
                            {tab === "output" && history.status === "fail"
                                ? (
                                    <Alert className="flex flex-col gap-2" variant="destructive">
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{errorToString(history.error)}</AlertDescription>
                                    </Alert>
                                )
                                : (
                                    <JsonView data={tab === "input" ? history.result?.input : history.result?.output} initialExpandDepth={4} />
                                )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
