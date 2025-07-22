"use client";

import { SidebarInset } from "@anole/ui/components/sidebar";
import type { FC } from "react";

import { Thread } from "@/components/assistant-ui/thread";
import ThreadList from "@/components/assistant-ui/thread-list";
import ConvexExternalRuntimeProvider from "@/features/chat/providers/convex-external-runtime-provider-tanstack";
import AppSidebar from "@/features/layout/components/app-sidebar";

import { useAiModelContext } from "../providers/ai-model-provider";
import ChatSiteHeader from "./chat-header";
import { ThreadProvider } from "./thread-context-tanstack";
import ThreadSidebar from "./thread-sidebar";

const Assistant: FC<{ jwtToken: string; threadId?: string }> = ({ jwtToken, threadId }) => {
    const { selectedModel } = useAiModelContext();

    return (
        <ThreadProvider>
            <ConvexExternalRuntimeProvider convex={undefined} model={selectedModel} streamIsRunning={false} threadListAdapter={undefined}>
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
