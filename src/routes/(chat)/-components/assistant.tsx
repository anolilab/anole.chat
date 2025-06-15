"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ConvexExternalRuntimeProvider } from "./convex-external-runtime-provider";
import { Thread } from "@/components/assistant-ui/thread";
import { useAiModelContext } from "../-provider/ai-model-provider";
import { ChatSiteHeader } from "./site-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ThreadProvider } from "./thread-context";
import { ThreadList } from "@/components/assistant-ui/thread-list";

export const Assistant = ({ threadId }: { threadId: string }) => {
    const { selectedModel } = useAiModelContext();

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
            className="bg-accent-foreground"
        >
            <ThreadProvider model={selectedModel}>
                <ConvexExternalRuntimeProvider model={selectedModel} threadId={threadId}>
                    <div className="flex h-dvh w-full">
                        <AppSidebar header={null} content={<ThreadList />} variant="inset" />
                        <SidebarInset className="flex flex-1 flex-col">
                            <ChatSiteHeader />
                            <Thread threadId={threadId} />
                        </SidebarInset>
                    </div>
                </ConvexExternalRuntimeProvider>
            </ThreadProvider>
        </SidebarProvider>
    );
};
