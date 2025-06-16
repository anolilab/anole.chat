import { AppSidebar } from "@/features/layout/components/app-sidebar";
import { AuthProvider } from "@/features/auth/components/auth-provider";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
                className="bg-accent-foreground"
            >
                <div className="flex h-dvh w-full">
                    <AppSidebar header={null} content={null} variant="inset" />
                    <SidebarInset>
                        <SiteHeader>
                            <Breadcrumb>
                                <BreadcrumbList>
                                    {breadcrumb.map((item, index) => (
                                        <BreadcrumbItem className="hidden md:block" key={item.href}>
                                            <BreadcrumbLink href={item.href} className="flex items-center gap-2 text-sm capitalize">
                                                {item.label}
                                                {index < breadcrumb.length - 1 && index !== 0 && <BreadcrumbSeparator className="hidden md:block" />}
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                    ))}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </SiteHeader>
                        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                            <Outlet />
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </AuthProvider>
    );
}
