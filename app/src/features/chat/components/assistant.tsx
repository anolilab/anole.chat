"use client";

import { SidebarInset } from "@anole/ui/components/sidebar";
import type { FC } from "react";

import { Thread } from "@/components/assistant-ui/thread";
import ThreadList from "@/components/assistant-ui/thread-list";
import AppSidebar from "@/features/layout/components/app-sidebar";

import ChatSiteHeader from "./chat-header";
import { ThreadProvider } from "./thread-context-tanstack";
import ThreadSidebar from "./thread-sidebar";

const Assistant: FC<{ jwtToken: string; threadId?: string }> = ({ jwtToken, threadId }) => (
    <ThreadProvider>
        <AppSidebar content={<ThreadList />} header={null} />
        <SidebarInset className="bg-white md:peer-data-[variant=inset]:m-1">
            <ChatSiteHeader threadId={threadId} />
            <Thread threadId={threadId} />
        </SidebarInset>
        <ThreadSidebar threadId={threadId} />
    </ThreadProvider>
);

export default Assistant;
