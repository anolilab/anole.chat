import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";

import { SidebarProvider } from "@/components/ui/sidebar";
import { RedirectToSignIn } from "@/features/auth/components/redirect-to-sign-in";
import { AiModelProvider } from "@/features/chat/providers/ai-model-provider";

export const Route = createFileRoute("/(chat)")({
    component: RouteComponent,
});

const RouteComponent = () => (
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
                            "--header-height": "calc(var(--spacing) * 8.5)",
                            "--sidebar-width": "calc(var(--spacing) * 94)",
                        } as React.CSSProperties
                    }
                >
                    <Outlet />
                </SidebarProvider>
            </AiModelProvider>
        </Authenticated>
    </>
);
