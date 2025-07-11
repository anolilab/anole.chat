"use client";

import { useThreadListItem } from "@assistant-ui/react";

import { SiteHeader } from "@/features/layout/components/site-header";

export const ChatSiteHeader = () => {
    const title = useThreadListItem((t) => t.title);

    return <SiteHeader title={title || "New Chat"} />;
};
