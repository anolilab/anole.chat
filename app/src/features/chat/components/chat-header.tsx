"use client";

import { SidebarTrigger } from "@anole/ui/components/sidebar";
import { useThreadListItem } from "@assistant-ui/react";
import { PanelRightIcon } from "lucide-react";
import type { FC } from "react";

import ThreadShareButton from "@/features/chat/components/thread-share-button";
import SiteHeader from "@/features/layout/components/site-header";

const ChatSiteHeader: FC<{ threadId?: string }> = ({ threadId }) => {
    const title = useThreadListItem((t) => t.title);

    return (
        <SiteHeader
            menu={(
                <>
                    {threadId && threadId !== "new" && <ThreadShareButton classes={{ button: "size-6 text-white" }} threadId={threadId} />}
                    <SidebarTrigger className="text-white" icon={<PanelRightIcon />} name="right" />
                </>
            )}
            title={title || "New Chat"}
        />
    );
};

export default ChatSiteHeader;
