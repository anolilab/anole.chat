"use client";

import { useThreadListItem } from "@assistant-ui/react";
import { useParams } from "@tanstack/react-router";

import { SiteHeader } from "@/features/layout/components/site-header";
import { ThreadShareButton } from "@/components/thread-share-button";

export const ChatSiteHeader = () => {
    const title = useThreadListItem((t) => t.title);
    const { threadId } = useParams({ from: "/(chat)/chat/$threadId" });

    return (
        <SiteHeader title={title || "New Chat"}>
            {threadId && threadId !== "new" && (
                <ThreadShareButton threadId={threadId} />
            )}
        </SiteHeader>
    );
};
