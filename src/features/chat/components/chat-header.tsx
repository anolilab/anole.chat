"use client";
import { SiteHeader } from "@/features/layout/components/site-header";
import { useThreadListItem } from "@assistant-ui/react";

export function ChatSiteHeader() {
    const title = useThreadListItem((t) => t.title);

    return <SiteHeader title={title || "New Chat"} />;
}
