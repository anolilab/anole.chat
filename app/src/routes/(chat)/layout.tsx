import { SidebarProvider } from "@anole/ui/components/sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";

import { AutoGuestSignIn } from "@/features/auth/components/auto-guest-signin";
import { AiModelProvider } from "@/features/chat/providers/ai-model-provider";
import { KeyboardShortcutsManager } from "@/components/keyboard-shortcuts-manager";
import { ProgrammableSidebarProvider } from "@/components/programmable-sidebar-provider";
import { useKeyboardShortcutHandler } from "@/hooks/use-keyboard-shortcut-handler";

const defaultOpen = ["left"];
const keyboardShortcuts = { left: "b", right: "l" };
const sidebarNames = ["left", "right"];
const sidebarStyle = {
    "--header-height": "calc(var(--spacing) * 10)",
    "--sidebar-width": "calc(var(--spacing) * 94)",
} as React.CSSProperties;

const RouteComponent = () => {
    const handleShortcut = useKeyboardShortcutHandler();
    
    return (
        <>
            <AuthLoading>
                <div>Loading...</div>
            </AuthLoading>
            <Unauthenticated>
                <AutoGuestSignIn />
            </Unauthenticated>
            <Authenticated>
                <AiModelProvider>
                    <KeyboardShortcutsManager onShortcut={handleShortcut}>
                    <ProgrammableSidebarProvider defaultOpen={defaultOpen} sidebarNames={sidebarNames} style={sidebarStyle}>
                        <Outlet />
                    </ProgrammableSidebarProvider>
                </KeyboardShortcutsManager>
            </AiModelProvider>
        </Authenticated>
    </>
);

export const Route = createFileRoute("/(chat)")({
    component: RouteComponent,
});
