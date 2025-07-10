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
        <Sidebar collapsible="offcanvas" variant="inset" className={cn("[&>div]:flex-row pl-0 py-0", className)} {...props}>
            <div className="bg-black w-3/12 h-screen flex items-center justify-center flex-col pr-5">
                <Link
                    to="/chat"
                    className="text-primary-foreground aspect-square size-8 rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
                    activeProps={{
                        className: "bg-primary text-accent-foreground"
                    }}
                    aria-label="Open messages"
                >
                    <MessageSquare className="size-6" />
                </Link>
            </div>
            <div className="flex flex-col rounded-l-xl relative bg-sidebar z-10 -ml-5 w-10/12">
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
