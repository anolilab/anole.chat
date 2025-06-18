import { AppSidebar } from "@/features/layout/components/app-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Outlet, useLocation, createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/features/layout/components/site-header";
import { Authenticated } from "convex/react";

export const Route = createFileRoute("/dashboard")({
    component: RouteComponent,
});

function RouteComponent() {
    const location = useLocation();
    const pathname = location.pathname;

    // Generate breadcrumb items from pathname, filtering out empty strings
    const pathSegments = pathname.split("/").filter(Boolean);

    const breadcrumbItems = pathSegments.map((segment, index) => {
        // Build the href by joining all segments up to current index
        const href = "/" + pathSegments.slice(0, index + 1).join("/");

        return {
            label: segment.charAt(0).toUpperCase() + segment.slice(1), // Capitalize first letter
            href: href,
        };
    });

    return (
        <Authenticated>
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 8.5)",
                    } as React.CSSProperties
                }
            >
                <div className="flex h-dvh w-full">
                    <AppSidebar content={null} />
                    <SidebarInset>
                        <SiteHeader>
                            <Breadcrumb>
                                <BreadcrumbList>
                                    {breadcrumbItems.map((item, index) => (
                                        <BreadcrumbItem key={item.href}>
                                            <BreadcrumbLink
                                                href={item.href}
                                                className="text-muted-foreground hover:text-foreground text-sm capitalize dark:hover:text-white"
                                            >
                                                {item.label}
                                            </BreadcrumbLink>
                                            {index < breadcrumbItems.length - 1 && (
                                                <BreadcrumbSeparator className="text-muted-foreground" />
                                            )}
                                        </BreadcrumbItem>
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
}
