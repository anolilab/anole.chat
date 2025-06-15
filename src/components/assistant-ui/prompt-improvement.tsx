import { useState, useCallback, useEffect, type FC } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { ThreadPrimitive, ComposerPrimitive } from "@assistant-ui/react";
import { useSession } from "@/hooks/auth-hooks";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { cn } from "@/lib/utils";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle,  
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

const usePromptImprovement = (threadId: string) => {
    const [isImproving, setIsImproving] = useState(false);
    const sessionData = useSession();

    const improvePrompt = useCallback(async (prompt: string, improvementInstructions?: string): Promise<string> => {
        if (!sessionData?.data?.session?.token || !prompt.trim()) {
            return prompt;
        }

        setIsImproving(true);   

        try {
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
            });

            if (!response.ok) {
                throw new Error("Failed to improve prompt");
            }

            const data = await response.json();

            return data.improvedPrompt || prompt;
        } catch (error) {
            console.error("Error improving prompt:", error);
            throw error; // Re-throw to handle in component
        } finally {
            setIsImproving(false);
        }
    }, [sessionData, threadId]);

    return { improvePrompt, isImproving };
};

interface PromptImprovementButtonProps {
    onImprove: () => void;
    isImproving: boolean;
    isDisabled: boolean;
}

export const PromptImprovementButton: FC<PromptImprovementButtonProps> = ({ onImprove, isImproving, isDisabled }) => {
    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onImprove();
    }, [onImprove]);

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

const PromptImprovementDialog: FC<PromptImprovementDialogProps> = ({
    isOpen,
    onOpenChange,
    currentPrompt,
    onApplyImprovement,
    onCancel,
    threadId
}) => {
    const { improvePrompt, isImproving } = usePromptImprovement(threadId);
    const [improvementInstructions, setImprovementInstructions] = useState("");
    const [improvedPrompt, setImprovedPrompt] = useState(currentPrompt);
    const [error, setError] = useState<string | null>(null);
    const [hasImproved, setHasImproved] = useState(false);
    const [localCurrentPrompt, setLocalCurrentPrompt] = useState(currentPrompt);

    // Reset state when dialog opens
    const handleOpenChange = useCallback((open: boolean) => {
        if (open) {
            setLocalCurrentPrompt(currentPrompt);
            setImprovedPrompt(currentPrompt);
            setImprovementInstructions("");
            setError(null);
            setHasImproved(false);
        }
        onOpenChange(open);
    }, [currentPrompt, onOpenChange]);

    // Update local current prompt when currentPrompt changes
    useEffect(() => {
        if (isOpen) {
            setLocalCurrentPrompt(currentPrompt);
            setImprovedPrompt(currentPrompt);
        }
    }, [currentPrompt, isOpen]);

    const handleImprove = useCallback(async () => {
        setError(null);
        try {
            const result = await improvePrompt(localCurrentPrompt, improvementInstructions);
            setImprovedPrompt(result);
            setHasImproved(true);
        } catch (error) {
            setError("Failed to improve prompt. Please try again.");
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
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Improve Prompt with AI</DialogTitle>
                    <DialogDescription>
                        Review your current prompt and optionally add instructions for how you'd like it improved.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 space-y-4 overflow-y-auto">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="current-prompt">
                            Current Prompt
                        </Label>
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
                        <Label htmlFor="improvement-instructions">
                            What would you like to improve? (optional)
                        </Label>
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
                            <Label htmlFor="improved-prompt">
                                Improved Prompt
                            </Label>
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
                    <Button 
                        onClick={handleImprove} 
                        disabled={isImproving || !localCurrentPrompt.trim()}
                        variant="secondary"
                    >
                        {isImproving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Improving...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Improve
                            </>
                        )}
                    </Button>
                    {hasImproved && (
                        <Button 
                            onClick={handleApply} 
                            disabled={isImproving || !improvedPrompt.trim()}
                        >
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
        const inputElement = document.querySelector('[data-composer-input]') as HTMLTextAreaElement;
        if (!inputElement) return;

        // Update the input value
        inputElement.value = improvedPrompt;
        // Trigger input event to update the composer state
        const event = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(event);
        // Focus the input
        inputElement.focus();
    }, []);

    const handleCancel = useCallback(() => {
        // Restore the original prompt back to the input field
        const inputElement = document.querySelector('[data-composer-input]') as HTMLTextAreaElement;
        if (inputElement && originalPrompt) {
            inputElement.value = originalPrompt;
            // Trigger input event to update the composer state
            const event = new Event('input', { bubbles: true });
            inputElement.dispatchEvent(event);
        }
    }, [originalPrompt]);

    return (
        <>
            <PromptImprovementButton onImprove={handleOpenDialog} isDisabled={!currentInputValue} isImproving={false} />
            <PromptImprovementDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                currentPrompt={currentPrompt}
                onApplyImprovement={handleApplyImprovement}
                onCancel={handleCancel}
                threadId={threadId}
            />
        </>
    );
};
