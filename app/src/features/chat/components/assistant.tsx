"use client";

import type { FC } from "react";

import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { SidebarInset } from "@/components/ui/sidebar";
import { ConvexExternalRuntimeProvider } from "@/features/chat/providers/convex-external-runtime-provider";
import AppSidebar from "@/features/layout/components/app-sidebar";

import { useAiModelContext } from "../providers/ai-model-provider";
import ChatSiteHeader from "./chat-header";
import ThreadSidebar from "./thread-sidebar";
import { ThreadProvider } from "./thread-context";

const Assistant: FC<{ jwtToken: string; threadId?: string }> = ({ jwtToken, threadId }) => {
    const { selectedModel } = useAiModelContext();

    return (
        <ThreadProvider model={selectedModel}>
            <ConvexExternalRuntimeProvider jwtToken={jwtToken} model={selectedModel} threadId={threadId}>
                <AppSidebar content={<ThreadList />} header={null} />
                <SidebarInset className="bg-white md:peer-data-[variant=inset]:m-1">
                    <ChatSiteHeader threadId={threadId} />
                    <Thread threadId={threadId} />
                </SidebarInset>
                <ThreadSidebar threadId={threadId} />
            </ConvexExternalRuntimeProvider>
        </ThreadProvider>
    );
};

export default Assistant;
