import { AuthProvider } from "@/features/auth/components/auth-provider";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AiModelProvider } from "@/features/chat/providers/ai-model-provider";
import { SidebarProvider } from "@/components/ui/sidebar";

export const Route = createFileRoute("/(chat)")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <AuthProvider>
            <AiModelProvider>
                {/* TODO: check why the bg-sidebar with inset variant is not working */}
                <SidebarProvider
                    style={
                        {
                            "--sidebar-width": "calc(var(--spacing) * 72)",
                            "--header-height": "calc(var(--spacing) * 8.5)",
                        } as React.CSSProperties
                    }
                >
                    <Outlet />
                </SidebarProvider>
            </AiModelProvider>
        </AuthProvider>
    );
}
