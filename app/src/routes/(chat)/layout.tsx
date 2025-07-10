import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AiModelProvider } from "@/features/chat/providers/ai-model-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { RedirectToSignIn } from "@/features/auth/components/redirect-to-sign-in";

export const Route = createFileRoute("/(chat)")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <AuthLoading>
                <div>Loading...</div>
            </AuthLoading>
            <Unauthenticated>
                <RedirectToSignIn />
            </Unauthenticated>
            <Authenticated>
                <AiModelProvider>
                    {/* TODO: check why the bg-sidebar with inset variant is not working */}
                    <SidebarProvider
                        style={
                            {
                                "--sidebar-width": "calc(var(--spacing) * 94)",
                                "--header-height": "calc(var(--spacing) * 8.5)",
                            } as React.CSSProperties
                        }
                    >
                        <Outlet />
                    </SidebarProvider>
                </AiModelProvider>
            </Authenticated>
        </>
    );
}
