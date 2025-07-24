"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { Avatar, AvatarFallback, AvatarImage } from "@anole/ui/components/avatar";
import { Button } from "@anole/ui/components/button";
import { Separator } from "@anole/ui/components/separator";
import TextShimmer from "@anole/ui/components/text-shimmer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import useCopy from "@anole/ui/hooks/use-copy-to-clipboard";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { throttle } from "@tanstack/react-pacer";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import { Check, ChevronDownIcon, ChevronRight, Copy, HammerIcon, Loader, Pencil, RefreshCw, Trash2, TriangleAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { lazy, memo, Suspense } from "react";
import { JsonView } from "react-json-view-lite";
import { toast } from "sonner";

import { safeJSONParse } from "@/lib/utils";
import type { ChatModel, ClientToolInvocation, ToolInvocationUIPart } from "@/types/chat";
import { isVercelAIWorkflowTool } from "@/types/workflow";

import { extractMCPToolId } from "../../lib/mcp/mcp-tool-id";
import { DefaultToolName } from "../../lib/tools";
import { Markdown } from "../markdown";
import { SelectModel } from "../select-model";
import { WorkflowInvocation } from "../tool-invocation/workflow-invocation";
import { MessageEditor } from "./message-editor";

type MessagePart = UIMessage["parts"][number];
type TextMessagePart = Extract<MessagePart, { type: "text" }>;
type AssistMessagePart = Extract<MessagePart, { type: "text" }>;

interface UserMessagePartProperties {
    isError?: boolean;
    isLast: boolean;
    message: UIMessage;
    part: TextMessagePart;
    reload: UseChatHelpers["reload"];
    setMessages: UseChatHelpers["setMessages"];
    status: UseChatHelpers["status"];
}

interface AssistMessagePartProperties {
    isError?: boolean;
    isLast: boolean;
    isLoading: boolean;
    message: UIMessage;
    part: AssistMessagePart;
    reload: UseChatHelpers["reload"];
    setMessages: UseChatHelpers["setMessages"];
    showActions: boolean;
    threadId?: string;
}

interface ToolMessagePartProperties {
    isError?: boolean;
    isLast?: boolean;
    isManualToolInvocation?: boolean;
    messageId: string;
    onProxyToolCall?: (result: ClientToolInvocation) => void;
    part: ToolInvocationUIPart;
    setMessages?: UseChatHelpers["setMessages"];
    showActions: boolean;
}

export const UserMessagePart = memo(
    ({ isError, isLast, message, part, reload, setMessages, status }: UserMessagePartProperties) => {
        const { copied, copy } = useCopy();
        const [mode, setMode] = useState<"view" | "edit">("view");
        const [isDeleting, setIsDeleting] = useState(false);
        const reference = useRef<HTMLDivElement>(null);
        const scrolledReference = useRef(false);

        const deleteMessage = useCallback(async () => {
            setIsDeleting(true);

            try {
                // await deleteMessageAction(message.id);
                setMessages((messages) => {
                    const index = messages.findIndex((m) => m.id === message.id);

                    if (index !== -1) {
                        return messages.filter((_, index_) => index_ !== index);
                    }

                    return messages;
                });
            } catch (error) {
                toast.error(error.message);
            } finally {
                setIsDeleting(false);
            }
        }, [message.id, setMessages]);

        useEffect(() => {
            if (status === "submitted" && isLast && !scrolledReference.current) {
                scrolledReference.current = true;

                reference.current?.scrollIntoView({ behavior: "smooth" });
            }
        }, [status]);

        if (mode === "edit") {
            return (
                <div className="flex w-full flex-row items-start gap-2">
                    <MessageEditor message={message} reload={reload} setMessages={setMessages} setMode={setMode} />
                </div>
            );
        }

        return (
            <div className="my-2 flex flex-col items-end gap-2">
                <div
                    className={cn(
                        "ring-input flex max-w-full flex-col gap-4 ring",
                        {
                            "bg-accent text-accent-foreground rounded-2xl px-4 py-3": isLast,
                            "opacity-50": isError,
                        },
                        isError && "border-destructive border",
                    )}
                    data-testid="message-content"
                >
                    <p className="text-sm break-words whitespace-pre-wrap">{part.text}</p>
                </div>
                {isLast && (
                    <div className="flex w-full justify-end opacity-0 transition-opacity duration-300 group-hover/message:opacity-100">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button className="size-3! p-4!" data-testid="message-edit-button" onClick={() => copy(part.text)} size="icon" variant="ghost">
                                    {copied ? <Check /> : <Copy />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Copy</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button className="size-3! p-4!" data-testid="message-edit-button" onClick={() => setMode("edit")} size="icon" variant="ghost">
                                    <Pencil />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Edit</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    className="hover:text-destructive size-3! p-4!"
                                    disabled={isDeleting}
                                    onClick={deleteMessage}
                                    size="icon"
                                    variant="ghost"
                                >
                                    {isDeleting ? <Loader className="animate-spin" /> : <Trash2 />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-destructive" side="bottom">
                                Delete Message
                            </TooltipContent>
                        </Tooltip>
                    </div>
                )}
                <div className="min-w-0" ref={reference} />
            </div>
        );
    },
    (previous, next) => {
        if (previous.part.text !== next.part.text)
            return false;

        if (previous.isError !== next.isError)
            return false;

        if (previous.isLast !== next.isLast)
            return false;

        if (previous.status !== next.status)
            return false;

        if (previous.message.id !== next.message.id)
            return false;

        if (!equal(previous.part, next.part))
            return false;

        return true;
    },
);
UserMessagePart.displayName = "UserMessagePart";

const throttleFunction = (function_: () => void, delay: number) => {
    const throttledFunction = throttle(function_, { wait: delay });

    throttledFunction();
};

export const AssistMessagePart = memo(
    ({ isError, isLast, isLoading: isChatLoading, message, part, reload, setMessages, showActions, threadId }: AssistMessagePartProperties) => {
        const { copied, copy } = useCopy();
        const [isLoading, setIsLoading] = useState(false);
        const [isDeleting, setIsDeleting] = useState(false);
        const reference = useRef<HTMLDivElement>(null);
        const [isAtBottom, setIsAtBottom] = useState(true);
        const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

        const deleteMessage = useCallback(async () => {
            setIsDeleting(true);

            try {
                // await deleteMessageAction(message.id);
                setMessages((messages) => {
                    const index = messages.findIndex((m) => m.id === message.id);

                    if (index !== -1) {
                        return messages.filter((_, index_) => index_ !== index);
                    }

                    return messages;
                });
            } catch (error) {
                toast.error(error.message);
            } finally {
                setIsDeleting(false);
            }
        }, [message.id, setMessages]);

        const handleModelChange = async (model: ChatModel) => {
            setIsLoading(true);

            try {
                if (threadId) {
                    // await deleteMessagesByChatIdAfterTimestampAction(message.id);
                }

                setMessages((messages) => {
                    const index = messages.findIndex((m) => m.id === message.id);

                    if (index !== -1) {
                        return [...messages.slice(0, index)];
                    }

                    return messages;
                });
                await reload({
                    body: {
                        id: threadId,
                        model,
                    },
                });
            } catch (error) {
                toast.error(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        useEffect(() => {
            // Only auto-scroll for the last message when AI is actively writing
            if (isLast && isChatLoading && shouldAutoScroll && isAtBottom) {
                throttleFunction(() => {
                    reference.current?.scrollIntoView({ behavior: "smooth" });
                }, 400);
            }
        }, [isLast, isChatLoading, shouldAutoScroll, isAtBottom, part.text]);

        useEffect(() => {
            // Only set up observer for the last message during loading
            if (!reference.current || !isLast || !isChatLoading)
                return;

            const observer = new IntersectionObserver(
                ([entry]) => {
                    setIsAtBottom(entry.isIntersecting);

                    // If user scrolled back to bottom, re-enable auto scroll
                    if (entry.isIntersecting && !shouldAutoScroll) {
                        setShouldAutoScroll(true);
                    }
                },
                {
                    root: null,
                    threshold: 0.3,
                },
            );

            observer.observe(reference.current);

            return () => {
                observer.disconnect();
            };
        }, [isLast, isChatLoading, shouldAutoScroll]);

        return (
            <div className={cn(isLoading && "animate-pulse", "flex flex-col gap-2")}>
                <div
                    className={cn("flex flex-col gap-4 px-2", {
                        "border-destructive bg-card rounded-lg border opacity-50": isError,
                    })}
                    data-testid="message-content"
                >
                    <Markdown>{part.text}</Markdown>
                </div>
                {showActions && (
                    <div className="flex w-full">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button className="size-3! p-4!" data-testid="message-edit-button" onClick={() => copy(part.text)} size="icon" variant="ghost">
                                    {copied ? <Check /> : <Copy />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <SelectModel onSelect={handleModelChange}>
                                        <Button
                                            className="size-3! p-4!"
                                            data-testid="message-edit-button data-[state=open]:bg-secondary!"
                                            size="icon"
                                            variant="ghost"
                                        >
                                            <RefreshCw />
                                        </Button>
                                    </SelectModel>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>Change Model</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    className="hover:text-destructive size-3! p-4!"
                                    disabled={isDeleting}
                                    onClick={deleteMessage}
                                    size="icon"
                                    variant="ghost"
                                >
                                    {isDeleting ? <Loader className="animate-spin" /> : <Trash2 />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-destructive" side="bottom">
                                Delete Message
                            </TooltipContent>
                        </Tooltip>
                    </div>
                )}
                <div className="min-w-0" ref={reference} />
            </div>
        );
    },
);
AssistMessagePart.displayName = "AssistMessagePart";
const variants = {
    collapsed: {
        height: 0,
        marginBottom: 0,
        marginTop: 0,
        opacity: 0,
    },
    expanded: {
        height: "auto",
        marginBottom: "0.5rem",
        marginTop: "1rem",
        opacity: 1,
    },
};

export const ReasoningPart = memo(({ isThinking, reasoning }: { isThinking?: boolean; reasoning: string }) => {
    const [isExpanded, setIsExpanded] = useState(isThinking);

    useEffect(() => {
        if (!isThinking && isExpanded) {
            setIsExpanded(false);
        }
    }, [isThinking]);

    return (
        <div
            className="flex cursor-pointer flex-col"
            onClick={() => {
                setIsExpanded(!isExpanded);
            }}
        >
            <div className="text-ring hover:text-primary flex flex-row items-center gap-2 transition-colors">
                {isThinking ? <TextShimmer>Reasoned for a few seconds</TextShimmer> : <div className="font-medium">Reasoned for a few seconds</div>}

                <button className="cursor-pointer" data-testid="message-reasoning-toggle" type="button">
                    <ChevronDownIcon size={16} />
                </button>
            </div>

            <div className="pl-4">
                <AnimatePresence initial={false}>
                    {isExpanded && (
                        <motion.div
                            animate="expanded"
                            className="text-muted-foreground flex flex-col gap-4 border-l pl-6"
                            data-testid="message-reasoning"
                            exit="collapsed"
                            initial="collapsed"
                            key="content"
                            style={{ overflow: "hidden" }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            variants={variants}
                        >
                            <Markdown>{reasoning}</Markdown>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});
ReasoningPart.displayName = "ReasoningPart";

const loading = memo(() => (
    <div className="px-6 py-4">
        <div className="h-44 w-full rounded-md opacity-0" />
    </div>
));

const PieChart = lazy(() =>
    import("../tool-invocation/pie-chart").then((module_) => {
        return { default: module_.PieChart };
    }),
);
const BarChart = lazy(() =>
    import("../tool-invocation/bar-chart").then((module_) => {
        return { default: module_.BarChart };
    }),
);
const LineChart = lazy(() =>
    import("../tool-invocation/line-chart").then((module_) => {
        return { default: module_.LineChart };
    }),
);
const WebSearchToolInvocation = lazy(() =>
    import("../tool-invocation/web-search").then((module_) => {
        return { default: module_.WebSearchToolInvocation };
    }),
);
const CodeExecutor = lazy(() =>
    import("../tool-invocation/code-executor").then((module_) => {
        return { default: module_.CodeExecutor };
    }),
);

export const ToolMessagePart = memo(
    ({ isError, isLast, isManualToolInvocation, messageId, onProxyToolCall, part, setMessages, showActions }: ToolMessagePartProperties) => {
        const { t } = useLingui();
        const { toolInvocation } = part;
        const { args, state, toolCallId, toolName } = toolInvocation;
        const [expanded, setExpanded] = useState(false);
        const { copied: copiedInput, copy: copyInput } = useCopy();
        const { copied: copiedOutput, copy: copyOutput } = useCopy();
        const [isDeleting, setIsDeleting] = useState(false);

        const deleteMessage = useCallback(async () => {
            setIsDeleting(true);

            try {
                // await deleteMessageAction(messageId);
                setMessages?.((messages) => {
                    const index = messages.findIndex((m) => m.id === messageId);

                    if (index !== -1) {
                        return messages.filter((_, index_) => index_ !== index);
                    }

                    return messages;
                });
            } catch (error) {
                toast.error(error.message);
            } finally {
                setIsDeleting(false);
            }
        }, [messageId, setMessages]);
        const onToolCallDirect = useMemo(
            () =>
                (onProxyToolCall
                    ? (result: any) =>
                        onProxyToolCall({
                            action: "direct",
                            result,
                        })
                    : undefined),
            [onProxyToolCall],
        );

        const result = useMemo(() => {
            if (state === "result") {
                return Array.isArray(toolInvocation.result?.content)
                    ? {
                        ...toolInvocation.result,
                        content: toolInvocation.result.content.map((node) => {
                            // mcp tools
                            if (node?.type === "text" && typeof node?.text === "string") {
                                const parsed = safeJSONParse(node.text);

                                return {
                                    ...node,
                                    text: parsed.success ? parsed.value : node.text,
                                };
                            }

                            return node;
                        }),
                    }
                    : toolInvocation.result;
            }

            return null;
        }, [state, (toolInvocation as any).result]);

        const CustomToolComponent = useMemo(() => {
            if (toolName === DefaultToolName.WebSearch || toolName === DefaultToolName.WebContent) {
                return (
                    <Suspense fallback={loading()}>
                        <WebSearchToolInvocation part={toolInvocation} />
                    </Suspense>
                );
            }

            if (toolName === DefaultToolName.JavascriptExecution) {
                return (
                    <Suspense fallback={loading()}>
                        <CodeExecutor key={toolInvocation.toolCallId} onResult={onToolCallDirect} part={toolInvocation} type="javascript" />
                    </Suspense>
                );
            }

            if (toolName === DefaultToolName.PythonExecution) {
                return (
                    <Suspense fallback={loading()}>
                        <CodeExecutor key={toolInvocation.toolCallId} onResult={onToolCallDirect} part={toolInvocation} type="python" />
                    </Suspense>
                );
            }

            if (state === "result") {
                switch (toolName) {
                    case DefaultToolName.CreateBarChart: {
                        return (
                            <Suspense fallback={loading()}>
                                <BarChart key={`${toolCallId}-${toolName}`} {...(args as any)} />
                            </Suspense>
                        );
                    }
                    case DefaultToolName.CreateLineChart: {
                        return (
                            <Suspense fallback={loading()}>
                                <LineChart key={`${toolCallId}-${toolName}`} {...(args as any)} />
                            </Suspense>
                        );
                    }
                    case DefaultToolName.CreatePieChart: {
                        return (
                            <Suspense fallback={loading()}>
                                <PieChart key={`${toolCallId}-${toolName}`} {...(args as any)} />
                            </Suspense>
                        );
                    }
                }
            }

            return null;
        }, [toolName, state, onToolCallDirect, result, args]);

        const isWorkflowTool = useMemo(() => isVercelAIWorkflowTool(result), [result]);

        const { serverName: mcpServerName, toolName: mcpToolName } = useMemo(() => extractMCPToolId(toolName), [toolName]);

        const isExpanded = useMemo(() => expanded || result === null || isWorkflowTool, [expanded, result, isWorkflowTool]);

        const isExecuting = useMemo(() => {
            if (isWorkflowTool)
                return result?.status === "running";

            return state !== "result" && (isLast || !!onProxyToolCall);
        }, [isWorkflowTool, result, state, isLast, !!onProxyToolCall]);

        return (
            <div className="group w-full">
                {CustomToolComponent || (
                    <div className="fade-in animate-in flex flex-col duration-300">
                        <div className="group/title flex cursor-pointer items-center gap-2" onClick={() => setExpanded(!expanded)}>
                            <div className="text-primary bg-input/40 rounded p-1.5">
                                {isExecuting
                                    ? (
                                        <Loader className="size-3.5 animate-spin" />
                                    )
                                    : isError
                                        ? (
                                            <TriangleAlert className="text-destructive size-3.5" />
                                        )
                                        : isWorkflowTool
                                            ? (
                                                <Avatar className="size-3.5">
                                                    <AvatarImage src={result.workflowIcon?.value} />
                                                    <AvatarFallback>{toolName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            )
                                            : (
                                                <HammerIcon className="size-3.5" />
                                            )}
                            </div>
                            <span className="flex items-center gap-2 font-bold">
                                {isExecuting ? <TextShimmer>{mcpServerName}</TextShimmer> : mcpServerName}
                            </span>
                            {mcpToolName && (
                                <>
                                    <ChevronRight className="size-3.5" />
                                    <span className="text-muted-foreground group-hover/title:text-primary transition-colors duration-300">{mcpToolName}</span>
                                </>
                            )}
                            <div className="group-hover/title:bg-input ml-auto rounded p-1.5 transition-colors duration-300">
                                <ChevronDownIcon className={cn(isExpanded && "rotate-180", "size-3.5")} />
                            </div>
                        </div>
                        <div className="flex gap-2 py-2">
                            <div className="flex w-7 justify-center">
                                <Separator className="to-border h-full bg-gradient-to-t from-transparent to-5%" orientation="vertical" />
                            </div>
                            <div className="flex w-full flex-col gap-2">
                                <div
                                    className={cn(
                                        "bg-card fade-300 w-full min-w-0 rounded-lg border p-4 px-4 text-xs transition-colors",
                                        !isExpanded && "hover:bg-secondary cursor-pointer",
                                    )}
                                    onClick={() => {
                                        if (!isExpanded) {
                                            setExpanded(true);
                                        }
                                    }}
                                >
                                    <div className="flex items-center">
                                        <h5 className="text-muted-foreground font-medium transition-colors select-none">Request</h5>
                                        <div className="flex-1" />
                                        {copiedInput
                                            ? (
                                                <Check className="size-3" />
                                            )
                                            : (
                                                <Button
                                                    className="text-muted-foreground size-3"
                                                    onClick={() => copyInput(JSON.stringify(toolInvocation.args))}
                                                    size="icon"
                                                    variant="ghost"
                                                >
                                                    <Copy className="size-3" />
                                                </Button>
                                            )}
                                    </div>
                                    {isExpanded && (
                                        <div className="max-h-[300px] overflow-y-auto p-2">
                                            <JsonView data={toolInvocation.args} />
                                        </div>
                                    )}
                                </div>
                                {result
                                    ? isWorkflowTool
                                        ? (
                                            <WorkflowInvocation result={result} />
                                        )
                                        : (
                                            <div
                                                className={cn(
                                                    "bg-card fade-300 mt-2 w-full min-w-0 rounded-lg border p-4 px-4 text-xs transition-colors",
                                                    !isExpanded && "hover:bg-secondary cursor-pointer",
                                                )}
                                                onClick={() => {
                                                    if (!isExpanded) {
                                                        setExpanded(true);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center">
                                                    <h5 className="text-muted-foreground font-medium select-none">Response</h5>
                                                    <div className="flex-1" />
                                                    {copiedOutput
                                                        ? (
                                                            <Check className="size-3" />
                                                        )
                                                        : (
                                                            <Button
                                                                className="text-muted-foreground size-3"
                                                                onClick={() => copyOutput(JSON.stringify(result))}
                                                                size="icon"
                                                                variant="ghost"
                                                            >
                                                                <Copy className="size-3" />
                                                            </Button>
                                                        )}
                                                </div>
                                                {isExpanded && (
                                                    <div className="max-h-[300px] overflow-y-auto p-2">
                                                        <JsonView data={result} />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    : null}

                                {onProxyToolCall && isManualToolInvocation && isLast && (
                                    <div className="mt-2 flex flex-row items-center gap-2">
                                        <Button
                                            className="rounded-full text-xs hover:ring"
                                            onClick={() => onProxyToolCall({ action: "manual", result: true })}
                                            size="sm"
                                            variant="secondary"
                                        >
                                            <Check />
                                            {t`Common.approve`}
                                        </Button>
                                        <Button
                                            className="rounded-full text-xs"
                                            onClick={() => onProxyToolCall({ action: "manual", result: false })}
                                            size="sm"
                                            variant="outline"
                                        >
                                            <X />
                                            {t`Common.reject`}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {showActions && (
                            <div className="flex flex-row items-center gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            className="hover:text-destructive size-3! p-4! opacity-0 group-hover/message:opacity-100"
                                            disabled={isDeleting}
                                            onClick={deleteMessage}
                                            size="icon"
                                            variant="ghost"
                                        >
                                            {isDeleting ? <Loader className="animate-spin" /> : <Trash2 />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-destructive" side="bottom">
                                        Delete Message
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    },
    (previous, next) => {
        if (previous.isError !== next.isError)
            return false;

        if (previous.isLast !== next.isLast)
            return false;

        if (previous.onProxyToolCall !== next.onProxyToolCall)
            return false;

        if (previous.showActions !== next.showActions)
            return false;

        if (previous.isManualToolInvocation !== next.isManualToolInvocation)
            return false;

        if (previous.messageId !== next.messageId)
            return false;

        if (!equal(previous.part.toolInvocation, next.part.toolInvocation))
            return false;

        return true;
    },
);

ToolMessagePart.displayName = "ToolMessagePart";
