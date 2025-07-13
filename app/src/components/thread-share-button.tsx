import { Share2 } from "lucide-react";
import { Button } from "./ui/button";
import { ThreadShareDialog } from "./thread-share-dialog";

interface ThreadShareButtonProps {
    threadId: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
}

export function ThreadShareButton({
    threadId,
    variant = "ghost",
    size = "icon"
}: ThreadShareButtonProps) {
    return (
        <ThreadShareDialog threadId={threadId}>
            <Button variant={variant} size={size}>
                <Share2 className="h-4 w-4" />
            </Button>
        </ThreadShareDialog>
    );
}