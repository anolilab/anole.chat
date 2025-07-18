import { SidebarProvider } from "@anole/ui/components/sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";

import { AutoGuestSignIn } from "@/features/auth/components/auto-guest-signin";
import { AiModelProvider } from "@/features/chat/providers/ai-model-provider";

const defaultOpen = ["left"];
const keyboardShortcuts = { left: "b", right: "l" };
const sidebarNames = ["left", "right"];
const sidebarStyle = {
    "--header-height": "calc(var(--spacing) * 10)",
    "--sidebar-width": "calc(var(--spacing) * 94)",
} as React.CSSProperties;

const RouteComponent = () => (
    <>
        <AuthLoading>
            <div>Loading...</div>
        </AuthLoading>
        <Unauthenticated>
            <AutoGuestSignIn />
        </Unauthenticated>
        <Authenticated>
            <AiModelProvider>
                {/* TODO: check why the bg-sidebar with inset variant is not working */}
                <SidebarProvider
                    defaultOpen={defaultOpen}
                    keyboardShortcuts={keyboardShortcuts}
                    sidebarNames={sidebarNames}
                    style={sidebarStyle}
                >
                    <Outlet />
                </SidebarProvider>
            </AiModelProvider>
        </Authenticated>
    </>
);

export const Route = createFileRoute("/(chat)")({
    component: RouteComponent,
});
