import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet, useLocation, createFileRoute } from "@tanstack/react-router";

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
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
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
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                        <Outlet />
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </AuthProvider>
    );
}
