"use client";

import { t } from "@lingui/core/macro";
import { Link } from "@tanstack/react-router";
import { Cog, MessageSquare } from "lucide-react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { NavUser } from "@/features/layout/components/nav-user";
import { cn } from "@/lib/utils";

const sidebarLinks = [
    {
        icon: MessageSquare,
        label: t`Open messages`,
        to: "/chat",
    },
    {
        icon: Cog,
        label: t`Open Account Settings`,
        to: "/dashboard/settings/account",
    },
    // Add more items here as needed
];

export const AppSidebar = ({
    className,
    content,
    footer,
    header,
    ...properties
}: React.ComponentProps<typeof Sidebar> & { content: React.ReactNode; footer?: React.ReactNode; header?: React.ReactNode }) => (
    <Sidebar className={cn("py-0 pl-0 [&>div]:flex-row", className)} collapsible="offcanvas" variant="inset" {...properties}>
        <div className="flex h-screen w-3/12 flex-col items-center justify-center bg-black pr-5 gap-2">
            {sidebarLinks.map(({ icon: Icon, label, to }) => (
                <Link
                    activeProps={{
                        className: "bg-primary text-primary-foreground",
                    }}
                    aria-label={label}
                    className="text-white hover:text-primary-foreground hover:bg-primary flex aspect-square size-8 items-center justify-center rounded-lg"
                    key={to}
                    to={to}
                >
                    <Icon className="size-6" />
                </Link>
            ))}
        </div>
        <div className="bg-sidebar relative z-10 -ml-5 flex w-10/12 flex-col rounded-l-xl">
            <SidebarHeader>{header}</SidebarHeader>
            <SidebarContent>{content}</SidebarContent>
            <SidebarFooter>
                {footer}
                <NavUser />
            </SidebarFooter>
        </div>
        <SidebarRail />
    </Sidebar>
);
