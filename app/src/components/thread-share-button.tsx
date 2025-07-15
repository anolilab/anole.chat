import { Share2 } from "lucide-react";

import ThreadShareDialog from "./thread-share-dialog";
import { Button } from "./ui/button";

interface ThreadShareButtonProperties {
    size?: "default" | "sm" | "lg" | "icon";
    threadId: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export const ThreadShareButton = ({ size = "icon", threadId, variant = "ghost" }: ThreadShareButtonProperties) => (
    <ThreadShareDialog threadId={threadId}>
        <Button size={size} variant={variant}>
            <Share2 className="h-4 w-4" />
        </Button>
    </ThreadShareDialog>
);
