import { SidebarProvider } from "@anole/ui/components/sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";

import { AutoGuestSignIn } from "@/features/auth/components/auto-guest-signin";
import { AiModelProvider } from "@/features/chat/providers/ai-model-provider";
import { KeyboardShortcutsManager } from "@/components/keyboard-shortcuts-manager";
import { ProgrammableSidebarProvider } from "@/components/programmable-sidebar-provider";

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
                <KeyboardShortcutsManager
                    onShortcut={(action, event) => {
                        // Handle keyboard shortcuts here
                        switch (action) {
                            case "newChat":
                                // Navigate to new chat
                                window.location.href = "/chat";
                                break;
                            case "search":
                                // Focus search input or open search modal
                                const searchInput = document.querySelector('[data-testid="search-input"]') as HTMLInputElement;
                                if (searchInput) {
                                    searchInput.focus();
                                }
                                break;
                            case "help":
                                // Toggle help overlay
                                const helpButton = document.querySelector('[data-testid="help-button"]') as HTMLButtonElement;
                                if (helpButton) {
                                    helpButton.click();
                                }
                                break;
                            case "escape":
                                // Close any open dialogs or modals
                                const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
                                document.dispatchEvent(escapeEvent);
                                break;
                            default:
                                console.log("Unhandled keyboard shortcut:", action, event);
                        }
                    }}
                >
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
