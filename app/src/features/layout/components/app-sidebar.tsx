"use client";

import { NavUser } from "@/features/layout/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const AppSidebar = ({
    header,
    content,
    footer,
    className,
    ...props
}: React.ComponentProps<typeof Sidebar> & { header?: React.ReactNode; content: React.ReactNode; footer?: React.ReactNode }) => {
    return (
        <Sidebar collapsible="offcanvas" variant="inset" className={cn("py-0 pl-0 [&>div]:flex-row", className)} {...props}>
            <div className="flex h-screen w-3/12 flex-col items-center justify-center bg-black pr-5">
                <Link
                    to="/chat"
                    className="text-primary-foreground hover:bg-primary flex aspect-square size-8 items-center justify-center rounded-lg transition-colors"
                    activeProps={{
                        className: "bg-primary text-accent-foreground",
                    }}
                    aria-label="Open messages"
                >
                    <MessageSquare className="size-6" />
                </Link>
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
};
