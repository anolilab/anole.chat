import { Alert, AlertDescription, AlertTitle } from "@anole/ui/components/alert";
import { Button } from "@anole/ui/components/button";
import JsonView from "@anole/ui/components/json-view";
import { TextShimmer } from "@anole/ui/components/text-shimmer";
import cn from "@anole/ui/utils/cn";
import equal from "lib/equal";
import { AlertTriangleIcon, Check, Copy, Loader2, XIcon } from "lucide-react";
import { memo, useEffect, useMemo, useRef } from "react";

import { useCopy } from "@/hooks/use-copy";
import type { VercelAIWorkflowToolStreamingResult } from "@/types/workflow";

import { NodeIcon } from "../workflow/node-icon";
import { NodeResultPopup } from "../workflow/node-result-popup";

interface WorkflowInvocationProperties {
    result: VercelAIWorkflowToolStreamingResult;
}

const PureWorkflowInvocation = ({ result }: WorkflowInvocationProperties) => {
    const { copied, copy } = useCopy();
    const savedResult = useRef<VercelAIWorkflowToolStreamingResult>(result);
    const output = useMemo(() => {
        if (result.status == "running")
            return null;

        if (result.status == "fail") {
            return (
                <Alert className="border-destructive" variant="destructive">
                    <AlertTriangleIcon className="size-3" />
                    <AlertTitle>{result?.error?.name || "ERROR"}</AlertTitle>
                    <AlertDescription>{result.error?.message}</AlertDescription>
                </Alert>
            );
        }

        if (!result.result)
            return null;

        return (
            <div className="bg-card text-muted-foreground w-full rounded-lg border p-4 text-xs">
                <div className="flex items-center">
                    <h5 className="text-muted-foreground font-medium select-none">Response</h5>
                    <div className="flex-1" />
                    {copied
                        ? (
                            <Check className="size-3" />
                        )
                        : (
                            <Button className="text-muted-foreground size-3" onClick={() => copy(JSON.stringify(result.result))} size="icon" variant="ghost">
                                <Copy className="size-3" />
                            </Button>
                        )}
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2">
                    <JsonView data={result.result} />
                </div>
            </div>
        );
    }, [result.status, result.error, result.result, copied]);

    useEffect(() => {
        if (result.status == "running") {
            savedResult.current = result;
        }
    }, [result]);

    return (
        <div className="flex w-full flex-col gap-1">
            {result.history.map((item, index) => {
                const result = item.result || savedResult.current.history[index]?.result;

                return (
                    <NodeResultPopup
                        disabled={!result}
                        history={{
                            endedAt: item.endedAt,
                            error: item.error?.message,
                            name: item.name,
                            result,
                            startedAt: item.startedAt,
                            status: item.status,
                        }}
                        key={item.id}
                    >
                        <div
                            className={cn(
                                "relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                                item.status == "fail" && "text-destructive",
                                !!result && "hover:bg-secondary cursor-pointer",
                            )}
                            key={item.id}
                        >
                            <div className="overflow-hidden rounded border">
                                <NodeIcon className="rounded-none" iconClassName="size-3" type={item.kind} />
                            </div>
                            {item.status == "running"
                                ? (
                                    <TextShimmer className="font-semibold">{`${item.name} Running...`}</TextShimmer>
                                )
                                : (
                                    <span className="font-semibold">{item.name}</span>
                                )}
                            <span className={cn("ml-auto text-xs", item.status != "fail" && "text-muted-foreground")}>
                                {item.status != "running" && ((item.endedAt! - item.startedAt!) / 1000).toFixed(2)}
                            </span>
                            {item.status == "success"
                                ? (
                                    <Check className="size-3" />
                                )
                                : item.status == "fail"
                                    ? (
                                        <XIcon className="size-3" />
                                    )
                                    : (
                                        <Loader2 className="size-3 animate-spin" />
                                    )}
                        </div>
                    </NodeResultPopup>
                );
            })}
            <div className="mt-2">{output}</div>
        </div>
    );
};

function areEqual(previous: WorkflowInvocationProperties, next: WorkflowInvocationProperties) {
    if (previous.result.status != next.result.status)
        return false;

    if (previous.result.error?.message != next.result.error?.message)
        return false;

    if (previous.result.result != next.result.result)
        return false;

    if (!equal(previous.result.history, next.result.history))
        return false;

    if (!equal(previous.result.result, next.result.result))
        return false;

    return true;
}

export const WorkflowInvocation = memo(PureWorkflowInvocation, areEqual);
