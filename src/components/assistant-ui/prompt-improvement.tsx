import { useState, useCallback, useEffect, type FC } from "react";
import { Sparkles, Loader2, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { ThreadPrimitive } from "@assistant-ui/react";
import { useSession } from "@/features/auth/hooks/auth-hooks";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ErrorFactory, ErrorUtils, RateLimitError, ValidationError, NetworkError, ContentError } from "@/lib/errors";
import { promptToast } from "@/lib/toast";
import { PromptImprovementErrorBoundary } from "@/components/error-boundaries/prompt-improvement-error-boundary";

const usePromptImprovement = (threadId: string) => {
    const [isImproving, setIsImproving] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const sessionData = useSession();

    const improvePrompt = useCallback(
        async (prompt: string, improvementInstructions?: string): Promise<string> => {
            // Validation
            if (!prompt.trim()) {
                throw new ValidationError("Prompt cannot be empty", "prompt");
            }

            if (prompt.trim().length > 10000) {
                throw new ContentError("Prompt is too long. Please keep it under 10,000 characters.", "prompt");
            }

            if (!sessionData?.data?.session?.token) {
                throw new ValidationError("Please sign in to improve prompts", "authentication");
            }

            setIsImproving(true);
            const toastId = promptToast.improving("prompt-improvement");

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

                const response = await fetch("/convex-http/chat/improve-prompt", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        prompt: prompt.trim(),
                        sessionToken: sessionData.data.session.token,
                        threadId,
                        improvementInstructions: improvementInstructions?.trim() || undefined,
                    }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    // Handle different HTTP status codes
                    if (response.status === 429) {
                        const errorData = await response.json().catch(() => ({}));
                        const retryAfter = errorData.retryAfter || 60000;
                        throw new RateLimitError(errorData.message || "Rate limit exceeded. Please try again later.", retryAfter);
                    }

                    const errorData = await response.json().catch(() => ({}));
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
        [sessionData, threadId],
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

interface PromptImprovementButtonProps {
    onImprove: () => void;
    isImproving: boolean;
    isDisabled: boolean;
}

export const PromptImprovementButton: FC<PromptImprovementButtonProps> = ({ onImprove, isImproving, isDisabled }) => {
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
                tooltip={isImproving ? "Improving prompt..." : "Improve prompt with AI"}
                variant="ghost"
                className="my-2.5 size-8 p-2 transition-opacity ease-in"
                onClick={handleClick}
                disabled={isImproving || isDisabled}
                type="button"
            >
                <Sparkles className={cn("h-4 w-4", isImproving && "animate-pulse")} />
            </TooltipIconButton>
        </ThreadPrimitive.If>
    );
};

interface PromptImprovementDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    currentPrompt: string;
    onApplyImprovement: (improvedPrompt: string) => void;
    onCancel: () => void;
    threadId: string;
}

const PromptImprovementDialog: FC<PromptImprovementDialogProps> = ({ isOpen, onOpenChange, currentPrompt, onApplyImprovement, onCancel, threadId }) => {
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
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
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
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
                            Retrying... (Attempt {retryCount + 1})
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="current-prompt">Current Prompt</Label>
                        <Textarea
                            id="current-prompt"
                            value={localCurrentPrompt}
                            onChange={(e) => {
                                // Update both current and improved prompt when editing current
                                const newValue = e.target.value;
                                setLocalCurrentPrompt(newValue);
                                if (!hasImproved) {
                                    setImprovedPrompt(newValue);
                                }
                            }}
                            className="min-h-32"
                            disabled={isImproving}
                            placeholder="Your current prompt will appear here..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="improvement-instructions">What would you like to improve? (optional)</Label>
                        <Textarea
                            id="improvement-instructions"
                            placeholder="e.g., Make it more concise, add technical details, improve clarity..."
                            value={improvementInstructions}
                            onChange={(e) => setImprovementInstructions(e.target.value)}
                            className="min-h-20"
                            disabled={isImproving}
                        />
                    </div>

                    {hasImproved && (
                        <div className="space-y-2">
                            <Label htmlFor="improved-prompt">Improved Prompt</Label>
                            <Textarea
                                id="improved-prompt"
                                value={improvedPrompt}
                                onChange={(e) => setImprovedPrompt(e.target.value)}
                                className="min-h-32"
                                disabled={isImproving}
                                placeholder="The improved prompt will appear here..."
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleCancel} disabled={isImproving}>
                        Cancel
                    </Button>
                    <Button onClick={handleImprove} disabled={isImproving || !localCurrentPrompt.trim()} variant="secondary">
                        {isImproving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Improving...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Improve
                            </>
                        )}
                    </Button>
                    {hasImproved && (
                        <Button onClick={handleApply} disabled={isImproving || !improvedPrompt.trim()}>
                            Apply
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

interface PromptImprovementProps {
    threadId: string;
    currentInputValue: string;
}

// Component that receives the current input value
export const PromptImprovement: FC<PromptImprovementProps> = ({ threadId, currentInputValue }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState("");
    const [originalPrompt, setOriginalPrompt] = useState("");

    const handleOpenDialog = useCallback(() => {
        setCurrentPrompt(currentInputValue);
        setOriginalPrompt(currentInputValue);
        setIsDialogOpen(true);
    }, [currentInputValue]);

    const handleApplyImprovement = useCallback((improvedPrompt: string) => {
        // Get the current input value and update it
        const inputElement = document.querySelector("[data-composer-input]") as HTMLTextAreaElement;
        if (!inputElement) return;

        // Update the input value
        inputElement.value = improvedPrompt;
        // Trigger input event to update the composer state
        const event = new Event("input", { bubbles: true });
        inputElement.dispatchEvent(event);
        // Focus the input
        inputElement.focus();
    }, []);

    const handleCancel = useCallback(() => {
        // Restore the original prompt back to the input field
        const inputElement = document.querySelector("[data-composer-input]") as HTMLTextAreaElement;
        if (inputElement && originalPrompt) {
            inputElement.value = originalPrompt;
            // Trigger input event to update the composer state
            const event = new Event("input", { bubbles: true });
            inputElement.dispatchEvent(event);
        }
    }, [originalPrompt]);

    return (
        <PromptImprovementErrorBoundary onRetry={handleOpenDialog} fallbackToInput={true}>
            <PromptImprovementButton onImprove={handleOpenDialog} isDisabled={!currentInputValue} isImproving={false} />
            <PromptImprovementDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                currentPrompt={currentPrompt}
                onApplyImprovement={handleApplyImprovement}
                onCancel={handleCancel}
                threadId={threadId}
            />
        </PromptImprovementErrorBoundary>
    );
};
