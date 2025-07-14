"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { SidebarInset } from "@/components/ui/sidebar";
import { ConvexExternalRuntimeProvider } from "@/features/chat/providers/convex-external-runtime-provider";
import AppSidebar from "@/features/layout/components/app-sidebar";

import { useAiModelContext } from "../providers/ai-model-provider";
import { ChatSiteHeader } from "./chat-header";
import { ThreadProvider } from "./thread-context";

export const Assistant = ({ jwtToken, threadId }: { jwtToken: string; threadId?: string }) => {
    const { selectedModel } = useAiModelContext();

    return (
        <ThreadProvider model={selectedModel}>
            <ConvexExternalRuntimeProvider jwtToken={jwtToken} model={selectedModel} threadId={threadId}>
                <div className="flex h-dvh w-full">
                    <AppSidebar content={<ThreadList />} header={null} />
                    <SidebarInset>
                        <ChatSiteHeader />
                        <Thread threadId={threadId} />
                    </SidebarInset>
                </div>
            </ConvexExternalRuntimeProvider>
        </ThreadProvider>
    );
};
