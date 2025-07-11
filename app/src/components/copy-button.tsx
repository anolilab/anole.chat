import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CopyButtonProperties {
    textToCopy: string;
}

export default function CopyButton({ textToCopy }: CopyButtonProperties) {
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (isCopied) {
            const timer = setTimeout(() => { setIsCopied(false); }, 2000);

            return () => { clearTimeout(timer); };
        }

        return () => {};
    }, [isCopied]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(textToCopy);
            setIsCopied(true);
        } catch (error) {
            console.error("Failed to copy text:", error);
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button className="h-8 w-8" onClick={handleCopy} size="icon" variant="link">
                        {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span className="sr-only">Copy to clipboard</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isCopied ? "Copied!" : "Copy to clipboard"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
