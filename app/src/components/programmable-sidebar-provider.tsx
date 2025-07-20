import { SidebarProvider, useSidebar } from "@anole/ui/components/sidebar";
import React from "react";

import { useKeyboardShortcuts } from "./keyboard-shortcuts-manager";

interface ProgrammableSidebarProviderProperties<T extends string> {
    children: React.ReactNode;
    className?: string;
    defaultOpen?: "all" | T[];
    sidebarNames: ReadonlyArray<T>;
    style?: React.CSSProperties;
}

export const ProgrammableSidebarProvider = <T extends string>({
    children,
    className,
    defaultOpen = "all",
    sidebarNames,
    style,
}: ProgrammableSidebarProviderProperties<T>) => {
    const { shortcuts } = useKeyboardShortcuts();

    // Create keyboard shortcuts mapping for sidebars
    const keyboardShortcuts = React.useMemo(() => {
        const mapping: Partial<Record<T, string>> = {};

        // Map known sidebar shortcuts
        const sidebarShortcutMap: Record<string, keyof typeof shortcuts> = {
            left: "sidebarLeft",
            right: "sidebarRight",
        };

        sidebarNames.forEach((name) => {
            const shortcutKey = sidebarShortcutMap[name as string];

            if (shortcutKey && shortcuts[shortcutKey]) {
                mapping[name] = shortcuts[shortcutKey] as string;
            }
        });

        return mapping;
    }, [sidebarNames, shortcuts]);

    return (
        <SidebarProvider className={className} defaultOpen={defaultOpen} keyboardShortcuts={keyboardShortcuts} sidebarNames={sidebarNames} style={style}>
            {children}
        </SidebarProvider>
    );
};

// Hook to use programmable sidebar
export function useProgrammableSidebar<T extends string>(name: T) {
    return useSidebar(name);
}
