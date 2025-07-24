"use client";

import { SidebarInset } from "@anole/ui/components/sidebar";
import type { FC } from "react";

import Chat from "@/features/ai/components/chat";
import ThreadList from "@/features/chat/components/thread-list";
import AppSidebar from "@/features/layout/components/app-sidebar";

import { useAiModelContext } from "../providers/ai-model-provider";
import ChatSiteHeader from "./chat-header";
import { ThreadProvider } from "./thread-context";
import ThreadSidebar from "./thread-sidebar";

const Assistant: FC<{ jwtToken: string; threadId?: string }> = ({ jwtToken, threadId }) => {
    const { selectedModel } = useAiModelContext();

    return (
        <ThreadProvider model={selectedModel}>
            <AppSidebar content={<ThreadList />} header={null} />
            <SidebarInset className="bg-white md:peer-data-[variant=inset]:m-1">
                <ChatSiteHeader threadId={threadId} />
                <Chat initialMessages={[]} />
            </SidebarInset>
            <ThreadSidebar threadId={threadId} />
        </ThreadProvider>
    );
};

export default Assistant;
