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
                <SidebarProvider
                    style={
                        {
                            "--sidebar-width": "calc(var(--spacing) * 72)",
                            "--header-height": "calc(var(--spacing) * 12)",
                        } as React.CSSProperties
                    }
                    className="bg-accent-foreground"
                >
                    <Outlet />
                </SidebarProvider>
            </AiModelProvider>
        </AuthProvider>
    );
}
