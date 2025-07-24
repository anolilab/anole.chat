import { CodeBlock } from "@anole/ui/components/CodeBlock";
import { Skeleton } from "@anole/ui/components/skeleton";
import TextShimmer from "@anole/ui/components/text-shimmer";
import useCopy from "@anole/ui/hooks/use-copy-to-clipboard";
import cn from "@anole/ui/utils/cn";
import { callCodeRunWorker } from "lib/code-runner/call-worker";
import type { CodeRunnerResult, LogEntry } from "lib/code-runner/code-runner.interface";
import { AlertTriangleIcon, CheckIcon, ChevronRight, CopyIcon, Loader, Percent, PlayIcon } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ToolInvocationUIPart } from "@/types/chat";

export const CodeExecutor = memo(
    ({ onResult, part, type }: { onResult?: (result?: any) => void; part: ToolInvocationUIPart["toolInvocation"]; type: "javascript" | "python" }) => {
        const isRun = useRef(false);

        const { copied, copy } = useCopy();
        const [isExecuting, setIsExecuting] = useState(false);

        const lastStartedAt = useRef<number>(Date.now());

        const [realtimeLogs, setRealtimeLogs] = useState<(CodeRunnerResult["logs"][number] & { time: number })[]>([]);

        const codeResultContainerReference = useRef<HTMLDivElement>(null);

        const runCode = useCallback(async (code: string, type: "javascript" | "python") => {
            lastStartedAt.current = Date.now();
            const result = await callCodeRunWorker(type, {
                code,
                onLog: (log) => {
                    setRealtimeLogs((previous) => [...previous, { ...log, time: Date.now() }]);
                },
                timeout: 30_000,
            });

            return result;
        }, []);

        const menualToolCall = useCallback(
            async (code: string) => {
                const result = await runCode(code, type);

                const logstring = JSON.stringify(result.logs);

                onResult?.({

                    ...result,
                    guide: "Execution finished. Provide: 1) Main results/outputs 2) Key insights or findings 3) Error explanations if any. Don't repeat code or raw logs - interpret and summarize for the user.",
                    logs:
                            logstring.length > 5000
                                ? [
                                    {
                                        args: [
                                            {
                                                type: "data",
                                                value: "Log output exceeded storage limit (10KB). Full output was displayed to user but truncated for server storage.",
                                            },
                                        ],
                                        type: "info",
                                    },
                                ]
                                : result.logs,
                });
            },
            [onResult],
        );
        const isRunning = useMemo(() => isExecuting || part.state !== "result", [isExecuting, part.state]);

        const scrollToCode = useCallback(() => {
            codeResultContainerReference.current?.scrollTo({
                behavior: "smooth",
                top: codeResultContainerReference.current.scrollHeight,
            });
        }, []);

        const result = useMemo(() => {
            if (part.state !== "result")
                return null;

            return part.result as CodeRunnerResult;
        }, [part]);

        const logs = useMemo(() => {
            const error = result?.error;
            const logs: (LogEntry & { time?: number })[] = realtimeLogs.length > 0 ? realtimeLogs : result?.logs ?? [];

            if (error) {
                logs.push({
                    args: [{ type: "data", value: error }],
                    time: lastStartedAt.current,
                    type: "error",
                });
            }

            return logs.map((log, index) => (
                <div
                    className={cn(
                        "text-muted-foreground flex gap-1 pl-3",
                        log.type === "error" && "text-destructive",
                        log.type === "warn" && "text-yellow-500",
                    )}
                    key={index}
                >
                    <div className="hidden w-[8.6rem] md:block">{new Date(log.time || Date.now()).toISOString()}</div>
                    <div className="flex h-[15px] items-center">
                        {log.type === "error"
                            ? (
                                <AlertTriangleIcon className="size-2" />
                            )
                            : log.type === "warn"
                                ? (
                                    <AlertTriangleIcon className="size-2" />
                                )
                                : (
                                    <ChevronRight className="size-2" />
                                )}
                    </div>
                    <div className="min-w-0 flex-1 gap-1 whitespace-pre-wrap">
                        {log.args.map((argument, index_) => {
                            if (argument.type === "image") {
                                return <img alt="Code output" key={index_} src={argument.value} />;
                            }

                            return (
                                <span key={index_}>
                                    {typeof argument?.value === "string" ? argument.value.toString() : JSON.stringify(argument.value ?? argument)}
                                </span>
                            );
                        })}
                    </div>
                </div>
            ));
        }, [part, realtimeLogs]);

        const reExecute = useCallback(async () => {
            if (isExecuting)
                return;

            setIsExecuting(true);
            setRealtimeLogs([
                {
                    args: [{ type: "data", value: "Re-executing code..." }],
                    time: Date.now(),
                    type: "log",
                },
            ]);
            const code = part.args?.code;

            runCode(code, type).then(() => setIsExecuting(false));
        }, [part.args, isExecuting, type]);

        const header = useMemo(() => {
            if (isRunning) {
                return (
                    <>
                        <Loader className="text-muted-foreground size-3 animate-spin" />
                        <TextShimmer className="text-xs">Generating Code...</TextShimmer>
                    </>
                );
            }

            return (
                <>
                    {result?.error
                        ? (
                            <>
                                <AlertTriangleIcon className="text-destructive size-3" />
                                <span className="text-destructive text-xs">ERROR</span>
                            </>
                        )
                        : (
                            <div className="bg-input flex h-4 w-4 items-end justify-end rounded-xs p-0.5 text-[7px] font-bold">
                                {type === "javascript" ? "JS" : type === "python" ? "PY" : ">_"}
                            </div>
                        )}
                </>
            );
        }, [part.state, result, isRunning]);

        const fallback = useMemo(() => <CodeFallback />, []);

        const logContainer = useMemo(() => {
            if (logs.length === 0)
                return null;

            return (
                <div className="text-foreground flex flex-col gap-1 border-t p-4 text-[10px]">
                    <div className="text-foreground flex items-center gap-1">
                        {isRunning ? <Loader className="size-2 animate-spin" /> : <div className="ring-border mr-1 h-1 w-1 rounded-full ring" />}
                        better-chatbot
                        <Percent className="size-2" />
                    </div>
                    {logs}
                    {isRunning && <div className="animate-caret-blink text-muted-foreground ml-3">|</div>}
                </div>
            );
        }, [logs, isRunning]);

        useEffect(() => {
            if (onResult && part.args && part.state === "call" && !isRun.current) {
                isRun.current = true;
                menualToolCall(part.args.code);
            }
        }, [part.state, !!onResult]);

        useEffect(() => {
            if (isRunning) {
                const closeKey = setInterval(scrollToCode, 300);

                return () => clearInterval(closeKey);
            }

            if (part.state === "result" && isRun.current) {
                scrollToCode();
            }
        }, [isRunning]);

        return (
            <div className="flex flex-col">
                <div className="px-6 py-3">
                    <div className="fade-in animate-in relative overflow-x-hidden rounded-lg border shadow duration-500">
                        <div className="bg-border z-10 flex min-h-[37px] items-center gap-1.5 px-4 py-2.5">
                            {header}
                            <div className="flex-1" />

                            {part.state === "result" && (
                                <>
                                    <div
                                        className="text-muted-foreground hover:bg-input hover:text-foreground flex cursor-pointer items-center gap-1 rounded-sm px-2 py-1 text-[10px] font-semibold transition-all"
                                        onClick={reExecute}
                                    >
                                        <PlayIcon className="size-2" />
                                        Run
                                    </div>
                                    <div
                                        className="text-muted-foreground hover:bg-input hover:text-foreground flex cursor-pointer items-center gap-1 rounded-sm px-2 py-1 text-[10px] font-semibold transition-all"
                                        onClick={() => copy(part.args?.code ?? "")}
                                    >
                                        {copied ? <CheckIcon className="size-2" /> : <CopyIcon className="size-2" />}
                                        Copy
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="relative">
                            <div className="from-background pointer-events-none absolute top-0 left-0 z-10 h-1/6 w-full bg-gradient-to-b to-transparent" />
                            <div className="from-background pointer-events-none absolute bottom-0 left-0 z-10 h-1/6 w-full bg-gradient-to-t to-transparent" />
                            <div className="from-background pointer-events-none absolute top-0 left-0 z-10 h-full w-1/6 bg-gradient-to-r to-transparent" />
                            <div className="from-background pointer-events-none absolute top-0 right-0 z-10 h-full w-1/6 bg-gradient-to-l to-transparent" />
                            <div className="max-h-[40vh] min-h-14 overflow-y-auto p-6 text-xs" ref={codeResultContainerReference}>
                                <CodeBlock className="overflow-x-auto p-4 text-[10px]" code={part.args?.code} fallback={fallback} lang={type} />
                            </div>
                        </div>
                        {logContainer}
                    </div>
                </div>
            </div>
        );
    },
);

const CodeFallback = () => (
    <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-1/6" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
    </div>
);
