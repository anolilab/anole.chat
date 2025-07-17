import { SidebarProvider } from "@anole/ui/components/sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";

import { AnonymousUserBanner } from "@/features/auth/components/anonymous-user-banner";
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
                {/* Anonymous user banner */}
                <AnonymousUserBanner className="fixed top-0 left-0 right-0 z-50" />
                
                {/* TODO: check why the bg-sidebar with inset variant is not working */}
                <SidebarProvider
                    defaultOpen={["left"]}
                    keyboardShortcuts={{ left: "b", right: "l" }}
                    sidebarNames={["left", "right"]}
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
