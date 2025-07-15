import { t } from "@lingui/core/macro";
import { Share2 } from "lucide-react";
import type { FC } from "react";

import ThreadShareDialog from "./thread-share-dialog";
import { Button } from "./ui/button";

interface ThreadShareButtonProperties {
    classes?: {
        button?: string;
        icon?: string;
    };
    threadId: string;
}

const ThreadShareButton: FC<ThreadShareButtonProperties> = ({ classes, threadId }) => (
    <ThreadShareDialog threadId={threadId}>
        <Button className={classes?.button} size="icon" variant="ghost">
            <Share2 className={classes?.icon} />
            <span className="sr-only">{t`Share Thread`}</span>
        </Button>
    </ThreadShareDialog>
);

export default ThreadShareButton;
