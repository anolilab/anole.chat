"use client";

import { useState } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/chat/chat-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentModel } from "convex/agents";
import { ConvexRuntimeProvider } from "./convex-runtime-provider";
import { Thread } from "@/components/assistant-ui/thread";

const models: AgentModel[] = ["gpt-4o-mini", "claude-3-5-sonnet", "gemini-1.5-flash"];

export const Assistant = () => {
  const [selectedModel, setSelectedModel] = useState<AgentModel>("gpt-4o-mini");

  return (
    <SidebarProvider>
      <ConvexRuntimeProvider model={selectedModel}>
        <div className="flex h-dvh w-full">
          <AppSidebar />
          <main className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="sm:hidden" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbPage>Playground</BreadcrumbPage>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <Select
                        value={selectedModel}
                        onValueChange={(v) => setSelectedModel(v as AgentModel)}
                      >
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
