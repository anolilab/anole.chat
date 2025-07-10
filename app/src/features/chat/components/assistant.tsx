"use client";

import { SidebarInset } from "@/components/ui/sidebar";
import { ConvexExternalRuntimeProvider } from "@/features/chat/providers/convex-external-runtime-provider";
import { Thread } from "@/components/assistant-ui/thread";
import { ChatSiteHeader } from "./chat-header";
import { AppSidebar } from "@/features/layout/components/app-sidebar";
import { ThreadProvider } from "./thread-context";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { useAiModelContext } from "../providers/ai-model-provider";
import { SettingsPanelProvider, SettingsPanel } from "./settings-panel";

export const Assistant = ({ threadId, jwtToken }: { threadId?: string; jwtToken: string }) => {
    const { selectedModel } = useAiModelContext();

    return (
        <ThreadProvider model={selectedModel}>
            <ConvexExternalRuntimeProvider model={selectedModel} threadId={threadId} jwtToken={jwtToken}>
                <AppSidebar header={null} content={<ThreadList />} />
                <SettingsPanelProvider>
                <SidebarInset>
                    <ChatSiteHeader />
                    <Thread threadId={threadId} />
                </SidebarInset>
                <SettingsPanel />
                </SettingsPanelProvider>
            </ConvexExternalRuntimeProvider>
        </ThreadProvider>
    );
};
