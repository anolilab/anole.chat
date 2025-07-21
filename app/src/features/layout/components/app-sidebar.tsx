"use client";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@anole/ui/components/sidebar";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { Link, useLocation } from "@tanstack/react-router";
import { Cog, LogIn, MessageSquare } from "lucide-react";
import type { ComponentProps, ComponentType, FC, ReactNode } from "react";

import AnonymousConvertCard from "@/features/auth/components/anonymous/anonymous-convert-card";
import useIsAnonymous from "@/features/auth/hooks/use-is-anonymous";
import { NavUser } from "@/features/layout/components/nav-user";

const AppSidebar: FC<
    ComponentProps<typeof Sidebar> & {
        content: ReactNode;
        footer?: ReactNode;
        header?: ReactNode;
    }
> = ({ className, content, footer, header }) => {
    const location = useLocation();
    const { t } = useLingui();
    const { isAnonymous } = useIsAnonymous();

    const sidebarLinks: {
        icon: ComponentType<{ className?: string }>;
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
    ];

    if (!isAnonymous) {
        sidebarLinks.push({
            icon: Cog,
            label: t`Open Account Settings`,
            matcher: (pathname) => pathname.startsWith("/dashboard/settings"),
            to: "/dashboard/settings/auth/account",
        });
    }

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
                    {isAnonymous
                        ? (
                            <>
                                <AnonymousConvertCard />
                                <Link
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-colors"
                                    to="/auth/sign-in"
                                >
                                    <LogIn className="size-4" />
                                    <span className="w-full text-center">{t`Login`}</span>
                                </Link>
                            </>
                        )
                        : (
                            <NavUser />
                        )}
                </SidebarFooter>
            </div>
            <SidebarRail name="left" />
        </Sidebar>
    );
};

export default AppSidebar;
