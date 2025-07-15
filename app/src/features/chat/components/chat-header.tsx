"use client";

import { useThreadListItem } from "@assistant-ui/react";
import type { FC } from "react";

import { ThreadShareButton } from "@/components/thread-share-button";
import { SiteHeader } from "@/features/layout/components/site-header";

const ChatSiteHeader: FC<{ threadId?: string }> = ({ threadId }) => {
    const title = useThreadListItem((t) => t.title);

    return <SiteHeader title={title || "New Chat"}>{threadId && threadId !== "new" && <ThreadShareButton threadId={threadId} />}</SiteHeader>;
};

export default ChatSiteHeader;
