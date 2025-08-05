import { Alert, AlertDescription, AlertTitle } from "@anole/ui/components/alert";
import { Button } from "@anole/ui/components/button";
import { FlipWords } from "@anole/ui/components/flip-words";
import { Input } from "@anole/ui/components/input";
import { Label } from "@anole/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@anole/ui/components/select";
import { Separator } from "@anole/ui/components/separator";
import { Switch } from "@anole/ui/components/switch";
import TextShimmer from "@anole/ui/components/text-shimmer";
import { Textarea } from "@anole/ui/components/textarea";
import useCopy from "@anole/ui/hooks/use-copy-to-clipboard";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { debounce } from "@tanstack/react-pacer";
import { useReactFlow } from "@xyflow/react";
import { notify } from "lib/notify";
import { errorToString } from "lib/utils";
import { AlertTriangleIcon, Check, Copy, Loader, Loader2, Maximize2, WandSparklesIcon, XIcon } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { JsonView } from "react-json-view-lite";
import { toast } from "sonner";
import type { GraphEndEvent } from "ts-edge";

import { generateObjectAction } from "@/app/api/chat/actions";
import { useWorkflowStore } from "@/app/store/workflow.store";
import { SelectModel } from "@/components/select-model";
import { useObjectState } from "@/hooks/use-object-state";

import { allNodeValidate } from "../../lib/workflow/node-validate";
import { decodeWorkflowEvents } from "../../lib/workflow/shared.workflow";
import type { NodeRuntimeHistory, UINode } from "../../lib/workflow/workflow.interface";
import { NodeKind } from "../../lib/workflow/workflow.interface";
import { appStore } from "../../store";
import { NodeIcon } from "../node-icon";
import { NodeResultPopup } from "../node-result-popup";

const debounceFunction = (function_: () => void, delay: number) => {
    const debouncedFunction = debounce(function_, { wait: delay });

    debouncedFunction();
};

export const ExecuteTab = ({ close, onSave }: { close: () => void; onSave: () => Promise<void> }) => {
    const { addProcess, processIds, workflow } = useWorkflowStore();

    const tabs = useMemo(
        () => [
            {
                label: "Input",
                value: "input",
            },
            {
                label: "Result",
                value: "result",
            },
        ],
        [],
    );

    const [tab, setTab] = useState<(typeof tabs)[number]["value"]>(tabs[0].value);
    const { t } = useLingui();
    const [isRunning, setIsRunning] = useState(false);
    const [histories, setHistories] = useState<NodeRuntimeHistory[]>([]);
    const [result, setResult] = useState<GraphEndEvent | undefined>();
    const { copied, copy } = useCopy();

    const isProcessing = useMemo(() => processIds.length > 0, [processIds.length]);

    const { fitView, getEdges, getNode, getNodes, setNodes, updateNodeData } = useReactFlow<UINode>();
    const nodes = getNodes();
    const historyReference = useRef<HTMLDivElement>(null);

    const [query, setQuery] = useObjectState({} as Record<string, any>);

    const startNodeData = useMemo(() => nodes.find((node) => node.data.kind === NodeKind.Input)!.data, [nodes]);

    const inputSchema = useMemo(() => startNodeData.outputSchema, [startNodeData]);

    const inputSchemaIterator = useMemo(() => Object.entries(inputSchema.properties ?? {}), [inputSchema]);

    const handleGenerateInputWithAI = useCallback(async () => {
        let model = appStore.getState().chatModel;
        const result = await notify.prompt({
            description: (
                <div className="flex items-center gap-2">
                    <p className="mr-auto">{t`Write a prompt to generate input for the workflow`}</p>
                    <SelectModel
                        onSelect={(m) => {
                            model = m;
                        }}
                    />
                </div>
            ),
            title: t`Generate Input With AI`,
        });

        if (!result)
            return;

        toast.promise(
            generateObjectAction({
                model,
                prompt: {
                    system: `You are a parameter generator for tool execution.
Analyze the user's request and generate creative JSON data that matches the provided schema.
If information cannot be inferred from the user's question, use your creativity to generate engaging data.
Fill all required fields and return only valid JSON without explanations.

tool-name: ${workflow!.name}
${workflow!.description ? `tool-description: ${workflow!.description}` : ""}`,
                    user: result,
                },
                schema: inputSchema,
            }).then((res) => {
                setQuery(res);
            }),
            {
                        error: t`Failed to generate input`,
        loading: t`Generating input with AI...`,
        success: t`Input generated successfully`,
            },
        );
    }, [inputSchema]);

    const handleClick = async () => {
        await onSave();
        const failSchema = inputSchemaIterator.find(([key]) => {
            if (inputSchema.required?.includes(key) && query[key] === undefined)
                return true;
        });

        if (failSchema) {
            return toast.warning(`${failSchema[0]} is Empty`);
        }

        const validateResult = allNodeValidate({
            edges: getEdges(),
            nodes,
        });

        if (validateResult !== true) {
            if (validateResult.node) {
                setNodes((nds) =>
                    nds.map((node) => {
                        if (node.id === validateResult.node?.id) {
                            return { ...node, selected: true };
                        }

                        if (node.selected) {
                            return { ...node, selected: false };
                        }

                        return node;
                    }),
                );
            }

            return toast.warning(validateResult.errorMessage);
        }

        run(query);
    };

    const fitviewWithDebounce = useCallback((id: string) => {
        const node = getNode(id);

        if (!node)
            return;

        const nextNodes = getEdges()
            .filter((edge) => edge.source === id)
            .map((edge) => getNode(edge.target))
            .filter(Boolean) as UINode[];
        const fitviewNodes = [node, ...nextNodes];

        debounceFunction(() => {
            fitView({
                duration: 300,
                maxZoom: 1.8,
                nodes: fitviewNodes,
            });
        }, 300);
    }, []);

    const run = useCallback(
        async (query: Record<string, any>) => {
            const stop = addProcess();
            const abortController = new AbortController();

            setHistories([]);
            setIsRunning(true);
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.data.runtime?.status) {
                        return {
                            ...node,
                            data: { ...node.data, runtime: { status: undefined } },
                        };
                    }

                    return node;
                }),
            );

            try {
                const response = await fetch(`/api/workflow/${workflow!.id}/execute`, {
                    body: JSON.stringify({ query }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const reader = response.body?.getReader();

                if (!reader) {
                    throw new Error("No readable stream available");
                }

                const decoder = new TextDecoder();
                let buffer = "";

                try {
                    while (true) {
                        const { done, value } = await reader.read();

                        if (done) {
                            break;
                        }

                        buffer += decoder.decode(value, { stream: true });
                        const { events, remainingBuffer } = decodeWorkflowEvents(buffer);

                        buffer = remainingBuffer;

                        for (const event of events) {
                            switch (event.eventType) {
                                case "NODE_START": {
                                    fitviewWithDebounce(event.node.name);
                                    historyReference.current?.scrollTo({
                                        behavior: "smooth",
                                        top: historyReference.current?.scrollHeight,
                                    });
                                    updateNodeData(event.node.name, {
                                        runtime: { status: "running" },
                                    });
                                    setHistories((previous) => {
                                        const uiNode = getNode(event.node.name);

                                        if (!uiNode)
                                            return previous;

                                        return [
                                            ...previous,
                                            {
                                                id: event.nodeExecutionId,
                                                kind: uiNode.data.kind,
                                                name: uiNode.data.name,
                                                nodeId: event.node.name,
                                                startedAt: Date.now(),
                                                status: "running",
                                            },
                                        ];
                                    });
                                    break;
                                }
                                case "WORKFLOW_END": {
                                    setResult(event);
                                    stop();
                                    break;
                                }
                                case "WORKFLOW_START": {
                                    setTab("result");
                                    break;
                                }
                                case "NODE_END": {
                                    updateNodeData(event.node.name, {
                                        runtime: { status: event.isOk ? "success" : "fail" },
                                    });
                                    setHistories((previous) => {
                                        const previousHistory = previous.find((h) => h.id === event.nodeExecutionId);

                                        if (!previousHistory)
                                            return previous;

                                        return previous.map((n) => {
                                            if (n !== previousHistory)
                                                return n;

                                            const source = event.isOk ? event.node.output : event.node.input;

                                            return {
                                                ...previousHistory,
                                                endedAt: Date.now(),
                                                error: event.error,
                                                result: {
                                                    input: source?.inputs?.[previousHistory.nodeId],
                                                    output: source?.outputs?.[previousHistory.nodeId],
                                                },
                                                status: event.isOk ? "success" : "fail",
                                            } as NodeRuntimeHistory;
                                        });
                                    });
                                }
                            }
                        }
                    }
                } finally {
                    reader.releaseLock();
                    stop();
                }
            } catch (error) {
                if (error instanceof Error && error.name === "AbortError") {
                    console.log("Workflow execution was aborted");
                } else {
                    console.error("Workflow execution error:", error);
                }

                stop();
            } finally {
                setIsRunning(false);
            }
        },
        [workflow!.id],
    );

    const lastOutput = useMemo(() => {
        const outputNodes = histories
            .filter((h) => h.kind === NodeKind.Output)
            .map((h) => h.result?.output)
            .filter(Boolean);

        if (outputNodes.length === 0)
            return undefined;

        if (outputNodes.length === 1)
            return outputNodes[0];

        return outputNodes;
    }, [histories]);

    const resultView = useMemo(() => {
        if (isRunning)
            return;

        if (result?.isOk === false) {
            return (
                <Alert className="border-destructive" variant="destructive">
                    <AlertTriangleIcon />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        <JsonView data={result?.error} />
                    </AlertDescription>
                </Alert>
            );
        }

        return (
            <div className="p-2">
                <JsonView data={lastOutput} />
            </div>
        );
    }, [isRunning, result]);

    return (
        <div className="fade-300 bg-card h-[85vh] w-sm overflow-y-auto rounded-lg border py-4 shadow-lg">
            <div className="flex flex-col px-4">
                <div className="flex h-9 w-full items-center gap-2">
                    <span className="font-semibold">Test Run</span>
                    <div className={cn("hover:bg-secondary ml-auto cursor-pointer rounded p-1", isProcessing && "sr-only")} onClick={close}>
                        <XIcon className="size-3.5" />
                    </div>
                </div>
            </div>
            <div className="flex">
                {tabs.map((t) => (
                    <Button
                        className={cn("rounded-none", tab === t.value && "border-primary border-b")}
                        key={t.value}
                        onClick={() => setTab(t.value)}
                        variant="ghost"
                    >
                        {t.label}
                    </Button>
                ))}
            </div>
            <Separator className="mb-4" />

            {tab === tabs[0].value
                ? (
                    <div className="flex flex-col gap-4 px-4">
                        {inputSchemaIterator.length === 0
                            ? (
                                <div className="flex h-40 items-center justify-center">
                                    <FlipWords className="text-muted-foreground text-sm" words={["No input required for this workflow"]} />
                                </div>
                            )
                            : (
                                <>
                                    <div
                                        className="hover:bg-secondary hover:text-primary ml-auto flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-xs font-semibold transition-colors"
                                        onClick={handleGenerateInputWithAI}
                                        tabIndex={1}
                                    >
                                        {t`Generate Input With AI`}
                                        <WandSparklesIcon className="size-3" />
                                    </div>
                                    {inputSchemaIterator.map(([key, schema], index) => (
                                        <div key={key ?? index}>
                                            <Label className="mb-2 ml-0.5 gap-0.5 text-sm font-semibold" htmlFor={key || String(index)}>
                                                {key || "undefined"}
                                                {inputSchema.required?.includes(key) && <span className="text-destructive text-xs">*</span>}
                                            </Label>
                                            {schema.type === "number"
                                                ? (
                                                    <Input
                                                        defaultValue={query[key] || undefined}
                                                        disabled={isProcessing}
                                                        id={key || String(index)}
                                                        onChange={(e) => setQuery({ ...query, [key]: Number(e.target.value) })}
                                                        placeholder={schema.description || "number"}
                                                        type="number"
                                                    />
                                                )
                                                : schema.type === "boolean"
                                                    ? (
                                                        <Switch
                                                            checked={query[key]}
                                                            disabled={isProcessing}
                                                            id={key || String(index)}
                                                            onCheckedChange={(checked) => setQuery({ ...query, [key]: checked })}
                                                        />
                                                    )
                                                    : schema.type === "string" && schema.enum
                                                        ? (
                                                            <Select disabled={isProcessing} onValueChange={(value) => setQuery({ ...query, [key]: value })} value={query[key]}>
                                                                <SelectTrigger className="min-w-46" id={key || String(index)}>
                                                                    <SelectValue placeholder={schema.description || "option"} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {(schema.enum as string[]).map((item, index_) => (
                                                                        <SelectItem key={item ?? index_} value={item}>
                                                                            {item}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )
                                                        : schema.type === "string"
                                                            ? (
                                                                <Textarea
                                                                    className="max-h-28 resize-none overflow-y-auto"
                                                                    disabled={isProcessing}
                                                                    id={key || String(index)}
                                                                    onChange={(e) => setQuery({ ...query, [key]: e.target.value })}
                                                                    placeholder={schema.description || "string"}
                                                                    value={query[key]}
                                                                />
                                                            )
                                                            : null}
                                        </div>
                                    ))}
                                </>
                            )}
                        <Button className="w-full font-bold" disabled={isProcessing} onClick={handleClick}>
                            {isProcessing ? <Loader className="size-3.5 animate-spin" /> : t`Run`}
                        </Button>
                    </div>
                )
                : tab === tabs[1].value
                    ? (
                        <div>
                            <div className="flex h-[30vh] flex-col overflow-y-auto px-4" ref={historyReference}>
                                {histories.map((history, index) => (
                                    <NodeResultPopup history={history} key={index}>
                                        <div
                                            className={cn(
                                                "hover:bg-secondary relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                                                history.status === "fail" && "text-destructive",
                                            )}
                                        >
                                            {index !== 0 && (
                                                <div className="absolute -top-1.5 left-4.5 h-3 w-px">
                                                    <Separator orientation="vertical" />
                                                </div>
                                            )}
                                            <div className="overflow-hidden rounded border">
                                                <NodeIcon className="rounded-none" iconClassName="size-3" type={history.kind} />
                                            </div>
                                            {history.status === "running"
                                                ? (
                                                    <TextShimmer className="font-semibold">{`${history.name} Running...`}</TextShimmer>
                                                )
                                                : (
                                                    <span className="font-semibold">{history.name}</span>
                                                )}
                                            <span className={cn("ml-auto text-xs", history.status !== "fail" && "text-muted-foreground")}>
                                                {history.status !== "running" && ((history.endedAt! - history.startedAt!) / 1000).toFixed(2)}
                                            </span>
                                            {history.status === "success"
                                                ? (
                                                    <Check className="size-3" />
                                                )
                                                : history.status === "fail"
                                                    ? (
                                                        <XIcon className="size-3" />
                                                    )
                                                    : (
                                                        <Loader2 className="size-3 animate-spin" />
                                                    )}
                                        </div>
                                    </NodeResultPopup>
                                ))}
                            </div>
                            <Separator />
                            <div className="px-4 py-4">
                                <div className="mb-4 flex items-center">
                                    <p className="text-sm font-semibold">Result</p>
                                    <div className="flex-1" />
                                    {result && (
                                        <NodeResultPopup
                                            history={{
                                                endedAt: result.endedAt,
                                                error: errorToString(result.error),
                                                name: "Result",
                                                result: {
                                                    input: histories[0].result?.output ?? {},
                                                    output: histories.at(-1)?.result?.output ?? {},
                                                },
                                                startedAt: result.startedAt,
                                                status: result.isOk ? "success" : "fail",
                                            }}
                                        >
                                            <Button size="icon" variant="ghost">
                                                <Maximize2 className="size-3" />
                                            </Button>
                                        </NodeResultPopup>
                                    )}
                                    <Button className="ml-auto" onClick={() => copy(JSON.stringify(lastOutput))} size="icon" variant="ghost">
                                        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                                    </Button>
                                </div>
                                {resultView}
                            </div>
                        </div>
                    )
                    : null}
        </div>
    );
};
