import { useState, useCallback, type FC } from "react";
import { Sparkles } from "lucide-react";
import { ThreadPrimitive } from "@assistant-ui/react";
import { useSession } from "@/hooks/auth-hooks";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { cn } from "@/lib/utils";

const usePromptImprovement = (threadId: string) => {
    const [isImproving, setIsImproving] = useState(false);
    const sessionData = useSession();

    const improvePrompt = useCallback(async (prompt: string): Promise<string> => {
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
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to improve prompt");
            }

            const data = await response.json();

            return data.improvedPrompt || prompt;
        } catch (error) {
            console.error("Error improving prompt:", error);
            return prompt; // Return original prompt on error
        } finally {
            setIsImproving(false);
        }
    }, [sessionData, threadId]);

    return { improvePrompt, isImproving };
};

interface PromptImprovementButtonProps {
    onImprove: () => void;
    isImproving: boolean;
}

export const PromptImprovementButton: FC<PromptImprovementButtonProps> = ({ onImprove, isImproving }) => {
    return (
        <ThreadPrimitive.If running={false}>
            <TooltipIconButton
                tooltip={isImproving ? "Improving prompt..." : "Improve prompt with AI"}
                variant="ghost"
                className="my-2.5 size-8 p-2 transition-opacity ease-in"
                onClick={onImprove}
                disabled={isImproving}
            >
                <Sparkles className={cn("h-4 w-4", isImproving && "animate-pulse")} />
            </TooltipIconButton>
        </ThreadPrimitive.If>
    );
};

interface PromptImprovementProps {
    threadId: string;
}

export const PromptImprovement: FC<PromptImprovementProps> = ({ threadId }) => {
    const { improvePrompt, isImproving } = usePromptImprovement(threadId);

    const handleImprovePrompt = useCallback(async () => {
        // Get the current input value
        const inputElement = document.querySelector('[data-composer-input]') as HTMLTextAreaElement;
        if (!inputElement) return;

        const currentPrompt = inputElement.value;

        if (!currentPrompt.trim()) {
            return;
        }

        try {
            const improvedPrompt = await improvePrompt(currentPrompt);
            if (improvedPrompt !== currentPrompt) {
                // Update the input value
                inputElement.value = improvedPrompt;
                // Trigger input event to update the composer state
                const event = new Event('input', { bubbles: true });
                inputElement.dispatchEvent(event);
                // Focus the input
                inputElement.focus();
            }
        } catch (error) {
            console.error("Failed to improve prompt:", error);
        }
    }, [improvePrompt]);

    if (!threadId) return null;

    return <PromptImprovementButton onImprove={handleImprovePrompt} isImproving={isImproving} />;
}; 