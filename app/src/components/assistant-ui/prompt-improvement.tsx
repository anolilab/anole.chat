import { Button } from "@anole/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@anole/ui/components/dialog";
import { Label } from "@anole/ui/components/label";
import { Textarea } from "@anole/ui/components/textarea";
import cn from "@anole/ui/utils/cn";
import { ThreadPrimitive, useComposer, useComposerRuntime } from "@assistant-ui/react";
import { AlertCircle, Loader2, Sparkles, Wifi, WifiOff } from "lucide-react";
import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { PromptImprovementErrorBoundary } from "@/components/error-boundaries/prompt-improvement-error-boundary";
import { ContentError, ErrorFactory, ErrorUtils, NetworkError, RateLimitError, ValidationError } from "@/lib/errors";
import { promptToast } from "@/lib/toast";

const usePromptImprovement = (threadId: string) => {
    const [isImproving, setIsImproving] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const improvePrompt = useCallback(
        async (prompt: string, improvementInstructions?: string): Promise<string> => {
            // Validation
            if (!prompt.trim()) {
                throw new ValidationError("Prompt cannot be empty", "prompt");
            }

            if (prompt.trim().length > 10_000) {
                throw new ContentError("Prompt is too long. Please keep it under 10,000 characters.", "prompt");
            }

            setIsImproving(true);

            promptToast.improving("prompt-improvement");

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    controller.abort();
                }, 30_000); // 30 second timeout

                const response = await fetch("/convex-http/chat/improve-prompt", {
                    body: JSON.stringify({
                        improvementInstructions: improvementInstructions?.trim() || undefined,
                        prompt: prompt.trim(),
                        threadId,
                    }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    // Handle different HTTP status codes
                    if (response.status === 429) {
                        const errorData = await response.json().catch(() => {
                            return {};
                        });
                        const retryAfter = errorData.retryAfter || 60_000;

                        throw new RateLimitError(errorData.message || "Rate limit exceeded. Please try again later.", retryAfter);
                    }

                    const errorData = await response.json().catch(() => {
                        return {};
                    });

                    throw ErrorFactory.fromResponse(response, errorData.error);
                }

                const data = await response.json();

                if (!data.improvedPrompt) {
                    throw new Error("No improved prompt received from server");
                }

                promptToast.improved("prompt-improvement");
                setRetryCount(0); // Reset retry count on success

                return data.improvedPrompt;
            } catch (error: any) {
                promptToast.failed(error, undefined, "prompt-improvement");

                if (error.name === "AbortError") {
                    throw new NetworkError("Request timed out. Please try again.", true);
                }

                if (error instanceof TypeError && error.message.includes("fetch")) {
                    throw new NetworkError("Connection error. Please check your internet connection.", true);
                }

                // Handle Convex errors
                if (error?.data?.kind === "RateLimitError") {
                    throw ErrorFactory.fromConvexError(error);
                }

                // Re-throw known errors
                if (error instanceof RateLimitError || error instanceof ValidationError || error instanceof NetworkError || error instanceof ContentError) {
                    throw error;
                }

                // Wrap unknown errors
                throw ErrorFactory.fromResponse(new Response(null, { status: 500 }), error.message || "Failed to improve prompt");
            } finally {
                setIsImproving(false);
            }
        },
        [threadId],
    );

    const improvePromptWithRetry = useCallback(
        async (prompt: string, improvementInstructions?: string, maxRetries: number = 3): Promise<string> => {
            let lastError: Error;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    return await improvePrompt(prompt, improvementInstructions);
                } catch (error: any) {
                    lastError = error;

                    // Don't retry for certain error types
                    if (error instanceof ValidationError || error instanceof RateLimitError || error instanceof ContentError) {
                        throw error;
                    }

                    // Don't retry on the last attempt
                    if (attempt === maxRetries) {
                        throw error;
                    }

                    // Only retry for retryable errors
                    if (!ErrorUtils.isRetryable(error)) {
                        throw error;
                    }

                    // Wait before retrying with exponential backoff
                    const delay = ErrorUtils.getRetryDelay(error, attempt);

                    await new Promise((resolve) => setTimeout(resolve, delay));
                    setRetryCount(attempt);
                }
            }

            throw lastError!;
        },
        [improvePrompt],
    );

    return {
        improvePrompt: improvePromptWithRetry,
        isImproving,
        retryCount,
    };
};

interface PromptImprovementButtonProperties {
    isDisabled: boolean;
    isImproving: boolean;
    onImprove: () => void;
}

export const PromptImprovementButton: FC<PromptImprovementButtonProperties> = ({ isDisabled, isImproving, onImprove }) => {
    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            onImprove();
        },
        [onImprove],
    );

    return (
        <ThreadPrimitive.If running={false}>
            <TooltipIconButton
                className="my-2.5 size-8 p-2 transition-opacity ease-in dark:text-neutral-100"
                disabled={isImproving || isDisabled}
                onClick={handleClick}
                tooltip={isImproving ? "Improving prompt..." : "Improve prompt with AI"}
                type="button"
                variant="ghost"
            >
                <Sparkles className={cn("h-4 w-4", isImproving && "animate-pulse")} />
            </TooltipIconButton>
        </ThreadPrimitive.If>
    );
};

interface PromptImprovementDialogProperties {
    currentPrompt: string;
    isOpen: boolean;
    onApplyImprovement: (improvedPrompt: string) => void;
    onCancel: () => void;
    onOpenChange: (open: boolean) => void;
    threadId: string;
}

const PromptImprovementDialog: FC<PromptImprovementDialogProperties> = ({ currentPrompt, isOpen, onApplyImprovement, onCancel, onOpenChange, threadId }) => {
    const { improvePrompt, isImproving, retryCount } = usePromptImprovement(threadId);
    const [improvementInstructions, setImprovementInstructions] = useState("");
    const [improvedPrompt, setImprovedPrompt] = useState(currentPrompt);
    const [error, setError] = useState<Error | null>(null);
    const [hasImproved, setHasImproved] = useState(false);
    const [localCurrentPrompt, setLocalCurrentPrompt] = useState(currentPrompt);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Reset state when dialog opens
    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (open) {
                setLocalCurrentPrompt(currentPrompt);
                setImprovedPrompt(currentPrompt);
                setImprovementInstructions("");
                setError(null);
                setHasImproved(false);
            }

            onOpenChange(open);
        },
        [currentPrompt, onOpenChange],
    );

    // Update local current prompt when currentPrompt changes
    useEffect(() => {
        if (isOpen) {
            setLocalCurrentPrompt(currentPrompt);
            setImprovedPrompt(currentPrompt);
        }
    }, [currentPrompt, isOpen]);

    // Monitor network status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
        };
        const handleOffline = () => {
            setIsOnline(false);
        };

        globalThis.addEventListener("online", handleOnline);
        globalThis.addEventListener("offline", handleOffline);

        return () => {
            globalThis.removeEventListener("online", handleOnline);
            globalThis.removeEventListener("offline", handleOffline);
        };
    }, []);

    const handleImprove = useCallback(async () => {
        setError(null);

        try {
            const result = await improvePrompt(localCurrentPrompt, improvementInstructions);

            setImprovedPrompt(result);
            setHasImproved(true);
        } catch (error: any) {
            setError(error);
            // Toast notifications are handled in the hook
        }
    }, [improvePrompt, localCurrentPrompt, improvementInstructions]);

    const handleApply = useCallback(() => {
        onApplyImprovement(improvedPrompt);
        onOpenChange(false);
    }, [improvedPrompt, onApplyImprovement, onOpenChange]);

    const handleCancel = useCallback(() => {
        onCancel();
        onOpenChange(false);
    }, [onCancel, onOpenChange]);

    return (
        <Dialog onOpenChange={handleOpenChange} open={isOpen}>
            <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col">
                <DialogHeader>
                    <DialogTitle>Improve Prompt with AI</DialogTitle>
                    <DialogDescription>Review your current prompt and optionally add instructions for how you'd like it improved.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 space-y-4 overflow-y-auto">
                    {error && (
                        <div className="bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{ErrorUtils.getUserMessage(error)}</span>
                        </div>
                    )}

                    {!isOnline && (
                        <div className="bg-warning/10 border-warning/20 text-warning flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                            <WifiOff className="h-4 w-4 flex-shrink-0" />
                            <span>You're offline. Please check your connection.</span>
                        </div>
                    )}

                    {retryCount > 0 && (
                        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                            Retrying... (Attempt
                            {" "}
                            {retryCount + 1}
                            )
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="current-prompt">Current Prompt</Label>
                        <Textarea
                            className="min-h-32"
                            disabled={isImproving}
                            id="current-prompt"
                            onChange={(e) => {
                                // Update both current and improved prompt when editing current
                                const newValue = e.target.value;

                                setLocalCurrentPrompt(newValue);

                                if (!hasImproved) {
                                    setImprovedPrompt(newValue);
                                }
                            }}
                            placeholder="Your current prompt will appear here..."
                            value={localCurrentPrompt}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="improvement-instructions">What would you like to improve? (optional)</Label>
                        <Textarea
                            className="min-h-20"
                            disabled={isImproving}
                            id="improvement-instructions"
                            onChange={(e) => {
                                setImprovementInstructions(e.target.value);
                            }}
                            placeholder="e.g., Make it more concise, add technical details, improve clarity..."
                            value={improvementInstructions}
                        />
                    </div>

                    {hasImproved && (
                        <div className="space-y-2">
                            <Label htmlFor="improved-prompt">Improved Prompt</Label>
                            <Textarea
                                className="min-h-32"
                                disabled={isImproving}
                                id="improved-prompt"
                                onChange={(e) => {
                                    setImprovedPrompt(e.target.value);
                                }}
                                placeholder="The improved prompt will appear here..."
                                value={improvedPrompt}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button disabled={isImproving} onClick={handleCancel} variant="outline">
                        Cancel
                    </Button>
                    <Button disabled={isImproving || !localCurrentPrompt.trim()} onClick={handleImprove} variant="secondary">
                        {isImproving
                            ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Improving...
                                </>
                            )
                            : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Improve
                                </>
                            )}
                    </Button>
                    {hasImproved && (
                        <Button disabled={isImproving || !improvedPrompt.trim()} onClick={handleApply}>
                            Apply
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

interface PromptImprovementProperties {
    threadId: string;
}

export const PromptImprovement: FC<PromptImprovementProperties> = ({ threadId }) => {
    const composerRuntime = useComposerRuntime();

    const currentInputValue = useComposer((c) => {
        if (!c.isEditing)
            return "";

        return c.text;
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const originalPrompt = useRef(currentInputValue);

    const handleOpenDialog = useCallback(() => {
        originalPrompt.current = currentInputValue;
        setIsDialogOpen(true);
    }, [currentInputValue]);

    return (
        <PromptImprovementErrorBoundary fallbackToInput onRetry={handleOpenDialog}>
            <PromptImprovementButton isDisabled={!currentInputValue} isImproving={false} onImprove={handleOpenDialog} />
            <PromptImprovementDialog
                currentPrompt={currentInputValue}
                isOpen={isDialogOpen}
                onApplyImprovement={(improvedPrompt) => {
                    composerRuntime.setText(improvedPrompt);
                }}
                onCancel={() => {
                    composerRuntime.setText(originalPrompt.current);
                }}
                onOpenChange={setIsDialogOpen}
                threadId={threadId}
            />
        </PromptImprovementErrorBoundary>
    );
};
