"use client";

import { useThreadListItem } from "@assistant-ui/react";
import type { FC } from "react";

import { ThreadShareButton } from "@/components/thread-share-button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import SiteHeader from "@/features/layout/components/site-header";
import { PanelRightIcon } from "lucide-react";

const ChatSiteHeader: FC<{ threadId?: string }> = ({ threadId }) => {
    const title = useThreadListItem((t) => t.title);

    return (
        <SiteHeader menu={<SidebarTrigger icon={<PanelRightIcon />} name="right" className="text-white" />} title={title || "New Chat"}>
            {threadId && threadId !== "new" && <ThreadShareButton threadId={threadId} />}
        </SiteHeader>
    );
};

export default ChatSiteHeader;
