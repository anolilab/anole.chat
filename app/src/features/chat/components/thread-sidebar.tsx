"use client";

import { api } from "@anole/convex/api";
import { Sidebar, SidebarContent, SidebarRail } from "@anole/ui/components/sidebar";
import { t } from "@lingui/core/macro";
import { useQuery } from "convex/react";
import type { FC } from "react";

const ThreadSummery: FC<{ threadId?: string }> = ({ threadId }) => {
    const data = useQuery(
        api.chat.functions.getThread,
        threadId
            ? {
                  threadId,
              }
            : "skip",
    );

    return (
        <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">{t`Thread summary`}</h2>
            <p className="whitespace-pre-line text-gray-700">{data?.summary || t`No summary available.`}</p>
        </div>
    );
};

const ThreadSidebar: FC<{ threadId?: string }> = ({ threadId }) => (
    <Sidebar className="py-1 [&>div]:rounded-l-xl [&>div]:bg-white" collapsible="offcanvas" name="right" side="right" variant="inset">
        <SidebarContent className="p-4">
            <ThreadSummery threadId={threadId} />
        </SidebarContent>
        <SidebarRail name="right" side="right" />
    </Sidebar>
);

export default ThreadSidebar;
