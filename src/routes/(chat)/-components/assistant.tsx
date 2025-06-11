"use client";

import { useState } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/routes/(chat)/-components/chat-sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AgentModel } from "convex/agents";
import { ConvexRuntimeProvider } from "./convex-runtime-provider";
import { Thread } from "@/components/assistant-ui/thread";
import type { Id } from "node_modules/convex/dist/esm-types/values/value";

const models: AgentModel[] = ["gpt-4o-mini", "claude-3-5-sonnet", "gemini-1.5-flash"];

export const Assistant = ({ threadId }: { threadId: Id<"threads"> }) => {
    const [selectedModel, setSelectedModel] = useState<AgentModel>("gpt-4o-mini");

    return (
        <SidebarProvider>
            <ConvexRuntimeProvider model={selectedModel} threadId={threadId}>
                <div className="flex h-dvh w-full">
                    <AppSidebar />
                    <main className="flex min-h-0 flex-1 flex-col">
                        <div className="bg-background flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 md:px-6">
                            <div className="flex items-center gap-4">
                                <SidebarTrigger className="sm:hidden" />
                                <Breadcrumb>
                                    <BreadcrumbList>
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>Playground</BreadcrumbPage>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as AgentModel)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a model" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {models.map((model) => (
                                                        <SelectItem key={model} value={model}>
                                                            {model}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>
                            </div>
                        </div>
                        <Separator />
                        <SidebarInset className="flex flex-1 flex-col">
                            <Thread />
                        </SidebarInset>
                    </main>
                </div>
            </ConvexRuntimeProvider>
        </SidebarProvider>
    );
};
