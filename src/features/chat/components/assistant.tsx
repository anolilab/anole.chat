"use client";

import { SidebarInset } from "@/components/ui/sidebar";
import { ConvexExternalRuntimeProvider } from "@/features/chat/providers/convex-external-runtime-provider";
import { Thread } from "@/components/assistant-ui/thread";
import { ChatSiteHeader } from "./chat-header";
import { AppSidebar } from "@/features/layout/components/app-sidebar";
import { ThreadProvider } from "./thread-context";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { useAiModelContext } from "../providers/ai-model-provider";

export const Assistant = ({ threadId }: { threadId: string }) => {
    const { selectedModel } = useAiModelContext();

    return (
        <ThreadProvider model={selectedModel}>
            <ConvexExternalRuntimeProvider model={selectedModel} threadId={threadId}>
                <div className="flex h-dvh w-full">
                    <AppSidebar header={null} content={<ThreadList />} />
                    <SidebarInset>
                        <ChatSiteHeader />
                        <Thread threadId={threadId} />
                    </SidebarInset>
                </div>
            </ConvexExternalRuntimeProvider>
        </ThreadProvider>
    );
};
