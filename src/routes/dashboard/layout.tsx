import { AppSidebar } from "@/features/layout/components/app-sidebar";
import { AuthProvider } from "@/features/auth/components/auth-provider";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Outlet, useLocation, createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/features/layout/components/site-header";

export const Route = createFileRoute("/dashboard")({
    component: RouteComponent,
});

function RouteComponent() {
    const location = useLocation();
    const pathname = location.pathname;

    const paths = pathname.split("/");
    const breadcrumb = paths.map((path) => {
        return {
            label: path,
            href: `/${path}`,
        };
    });
    return (
        <AuthProvider>
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 8.5)",
                    } as React.CSSProperties
                }
            >
                <div className="flex h-dvh w-full">
                    <AppSidebar content={<div />} />
                    <SidebarInset>
                        <SiteHeader>
                            <Breadcrumb>
                                <BreadcrumbList>
                                    {breadcrumb.map((item, index) => (
                                        <BreadcrumbItem className="hidden md:block" key={item.href}>
                                            <BreadcrumbLink
                                                href={item.href}
                                                className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm capitalize transition-colors dark:hover:text-white"
                                            >
                                                {item.label}
                                                {index < breadcrumb.length - 1 && index !== 0 && (
                                                    <BreadcrumbSeparator className="text-muted-foreground hidden md:block" />
                                                )}
                                            </BreadcrumbLink>
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
        </AuthProvider>
    );
}
