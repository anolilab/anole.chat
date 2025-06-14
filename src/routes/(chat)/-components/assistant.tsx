"use client";

import { useState } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/routes/(chat)/-components/chat-sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AgentModel } from "convex/agents";
import { ConvexExternalRuntimeProvider, ThreadProvider } from "./convex-external-runtime-provider";
import { Thread } from "@/components/assistant-ui/thread";
import { useAiModelContext } from "../-provider/ai-model-provider";
import { ChatSiteHeader } from "./chat-site-header";

export const Assistant = ({ threadId }: { threadId: Id<"threads"> }) => {
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
                        <ChatSidebar />
                        <AppSidebar header={null} content={<ThreadList />} variant="inset" />
                            <SidebarInset className="flex flex-1 flex-col">
                            <ChatSiteHeader threadId={threadId} />
                                <Thread threadId={threadId} />
                            </SidebarInset>
                        </main>
                    </div>
                </ConvexExternalRuntimeProvider>
            </ThreadProvider>
        </SidebarProvider>
    );
};
