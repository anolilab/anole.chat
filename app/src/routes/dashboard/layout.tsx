import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { Authenticated } from "convex/react";
import { Building, ChartArea, Key, MessageSquare, Shield, ToggleLeft, User, Users, Zap } from "lucide-react";
import { Fragment } from "react";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import AppSidebar from "@/features/layout/components/app-sidebar";
import type { NavItem } from "@/features/layout/components/nav-items";
import { NavItems } from "@/features/layout/components/nav-items";
import { SiteHeader } from "@/features/layout/components/site-header";
import { getAuthRedirectUrl } from "@/lib/utils";

const sidebarHeader = (
    <div className="flex items-center gap-2 px-4 py-2">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <MessageSquare className="size-4" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">AI Chat</span>
            <span className="truncate text-xs">Dashboard</span>
        </div>
    </div>
);

const getNavigationItems = (apiKey: unknown, organization: unknown) => {
    return {
        ai: [
            {
                icon: User,
                name: "Personalization",
                url: "/dashboard/settings/ai/personalization",
            },
            {
                icon: Key,
                name: "Providers",
                url: "/dashboard/settings/ai/providers",
            },
            {
                icon: Zap,
                name: "Models",
                url: "/dashboard/settings/ai/models",
            },
            {
                icon: ToggleLeft,
                name: "AI Options",
                url: "/dashboard/settings/ai/options",
            },
            {
                icon: ChartArea,
                name: "Usage Analytics",
                url: "/dashboard/settings/ai/usage-analytics",
            },
        ],
        settings: [
            {
                icon: User,
                name: "Account",
                url: "/dashboard/settings/auth/account",
            },
            {
                icon: Shield,
                name: "Security",
                url: "/dashboard/settings/auth/security",
            },
            apiKey && {
                icon: Key,
                name: "API Keys",
                url: "/dashboard/settings/auth/api-keys",
            },
            organization && {
                icon: Building,
                name: "Organizations",
                url: "/dashboard/settings/auth/organizations",
            },
            organization && {
                icon: Building,
                name: "Organization",
                url: "/dashboard/settings/auth/organization",
            },
            organization && {
                icon: Users,
                name: "Members",
                url: "/dashboard/settings/auth/members",
            },
        ].filter(Boolean) as NavItem[],
    };
};

const RouteComponent = () => {
    const location = useLocation();

    const { pathname } = location;

    // Generate breadcrumb items from pathname, filtering out empty strings
    const pathSegments = pathname.split("/").filter(Boolean);

    const breadcrumbItems = pathSegments.map((segment, index) => {
        // Build the href by joining all segments up to current index
        const href = `/${pathSegments.slice(0, index + 1).join("/")}`;

        return {
            href,
            isLast: index === pathSegments.length - 1,
            label: segment.charAt(0).toUpperCase() + segment.slice(1), // Capitalize first letter
        };
    });

    const { apiKey, organization } = useAuth();
    const navigationItems = getNavigationItems(apiKey, organization);
    const sidebarContent = (
        <>
            <NavItems classes={{ group: "pr-0" }} colorMode="dark" items={navigationItems.ai} label="Ai" />
            <NavItems classes={{ group: "pr-0" }} colorMode="dark" items={navigationItems.settings} label="Settings" />
        </>
    );

    return (
        <Authenticated>
            <SidebarProvider
                style={
                    {
                        "--header-height": "calc(var(--spacing) * 8.5)",
                        "--sidebar-width": "calc(var(--spacing) * 94)",
                    } as React.CSSProperties
                }
            >
                <div className="flex h-dvh w-full">
                    <AppSidebar content={sidebarContent} header={sidebarHeader} />
                    <SidebarInset>
                        <SiteHeader>
                            <Breadcrumb>
                                <BreadcrumbList>
                                    {breadcrumbItems.map((item, index) => (
                                        <Fragment key={item.href}>
                                            <BreadcrumbItem>
                                                {item.isLast
                                                    ? (
                                                        <BreadcrumbPage className="text-foreground font-medium">{item.label}</BreadcrumbPage>
                                                    )
                                                    : (
                                                        <BreadcrumbLink
                                                            className="text-muted-foreground hover:text-foreground text-sm capitalize transition-colors dark:hover:text-white"
                                                            href={item.href}
                                                        >
                                                            {item.label}
                                                        </BreadcrumbLink>
                                                    )}
                                            </BreadcrumbItem>
                                            {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator className="text-muted-foreground mx-2" />}
                                        </Fragment>
                                    ))}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </SiteHeader>

                        <ScrollArea className="h-full w-full">
                            <div className="flex flex-1 flex-col items-center bg-inherit px-4 pt-8 [&>div]:w-full">
                                <Outlet />
                            </div>
                        </ScrollArea>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </Authenticated>
    );
};

export const Route = createFileRoute("/dashboard")({
    beforeLoad: async ({ context }) => {
        const chatUrl = await getAuthRedirectUrl(context.queryClient);

        return {
            chatUrl,
        };
    },
    component: RouteComponent,
});
