import React from "react";
import { SidebarProvider, useSidebar } from "@anole/ui/components/sidebar";
import { useKeyboardShortcuts } from "./keyboard-shortcuts-manager";

interface ProgrammableSidebarProviderProps<T extends string> {
    children: React.ReactNode;
    defaultOpen?: "all" | T[];
    sidebarNames: ReadonlyArray<T>;
    style?: React.CSSProperties;
    className?: string;
}

export function ProgrammableSidebarProvider<T extends string>({
    children,
    defaultOpen = "all",
    sidebarNames,
    style,
    className,
}: ProgrammableSidebarProviderProps<T>) {
    const { shortcuts } = useKeyboardShortcuts();

    // Create keyboard shortcuts mapping for sidebars
    const keyboardShortcuts = React.useMemo(() => {
        const mapping: Partial<Record<T, string>> = {};
        
        if (sidebarNames.includes("left" as T) && shortcuts.sidebarLeft) {
            mapping["left" as T] = shortcuts.sidebarLeft;
        }
        if (sidebarNames.includes("right" as T) && shortcuts.sidebarRight) {
            mapping["right" as T] = shortcuts.sidebarRight;
        }
        
        return mapping;
    }, [sidebarNames, shortcuts]);

    return (
        <SidebarProvider
            defaultOpen={defaultOpen}
            keyboardShortcuts={keyboardShortcuts}
            sidebarNames={sidebarNames}
            style={style}
            className={className}
        >
            {children}
        </SidebarProvider>
    );
}

// Hook to use programmable sidebar
export function useProgrammableSidebar<T extends string>(name: T) {
    return useSidebar(name);
}