"use client";

import { t } from "@lingui/core/macro";
import { Link, useLocation } from "@tanstack/react-router";
import { Cog, File, MessageSquare } from "lucide-react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { NavUser } from "@/features/layout/components/nav-user";
import { cn } from "@/lib/utils";

const AppSidebar = ({
    className,
    content,
    footer,
    header,
}: React.ComponentProps<typeof Sidebar> & { content: React.ReactNode; footer?: React.ReactNode; header?: React.ReactNode }) => {
    const location = useLocation();

    const sidebarLinks: {
        icon: React.ComponentType<{ className?: string }>;
        label: string;
        matcher?: (pathname: string) => boolean;
        to: string;
    }[] = [
        {
            icon: MessageSquare,
            label: t`Open messages`,
            matcher: (pathname) => pathname.startsWith("/chat"),
            to: "/chat",
        },
        {
            icon: File,
            label: t`Files`,
            to: "/files",
        },
        {
            icon: Cog,
            label: t`Open Account Settings`,
            matcher: (pathname) => pathname.startsWith("/dashboard/settings"),
            to: "/dashboard/settings/auth/account",
        },
    ];

    return (
        <Sidebar className={cn("py-0 pl-0 [&>div]:flex-row", className)} collapsible="offcanvas" name="left" variant="inset">
            <div className="flex h-screen w-3/12 flex-col items-center justify-center gap-2 bg-black pr-5">
                {sidebarLinks.map(({ icon: Icon, label, matcher, to }) => {
                    const isActive = matcher ? matcher(location.pathname) : location.pathname === to;

                    return (
                        <Link
                            aria-label={label}
                            className={cn(
                                "hover:text-primary-foreground hover:bg-primary flex aspect-square size-8 items-center justify-center rounded-lg text-white",
                                isActive && "bg-primary text-primary-foreground",
                            )}
                            key={to}
                            to={to}
                        >
                            <Icon className="size-6" />
                        </Link>
                    );
                })}
            </div>
            <div className="bg-sidebar relative z-10 -ml-5 flex w-10/12 flex-col rounded-l-xl">
                <SidebarHeader>{header}</SidebarHeader>
                <SidebarContent>{content}</SidebarContent>
                <SidebarFooter>
                    {footer}
                    <NavUser />
                </SidebarFooter>
            </div>
            <SidebarRail name="left" />
        </Sidebar>
    );
};

export default AppSidebar;
