import React from "react";
import { TanStackSidebarProvider, useTanStackSidebar } from "./tanstack-sidebar-provider";

interface ProgrammableSidebarProviderProperties<T extends string> {
    children: React.ReactNode;
    className?: string;
    defaultOpen?: "all" | T[];
    sidebarNames: ReadonlyArray<T>;
    style?: React.CSSProperties;
    onOpenChange?: (open: T[]) => void;
    open?: T[];
}

export const ProgrammableSidebarProvider = <T extends string>({
    children,
    className,
    defaultOpen = "all",
    sidebarNames,
    style,
    onOpenChange,
    open,
}: ProgrammableSidebarProviderProperties<T>) => {
    return (
        <TanStackSidebarProvider 
            className={className} 
            defaultOpen={defaultOpen} 
            sidebarNames={sidebarNames} 
            style={style}
            onOpenChange={onOpenChange}
            open={open}
        >
            {children}
        </TanStackSidebarProvider>
    );
};

// Hook to use programmable sidebar (now uses TanStack DB)
export function useProgrammableSidebar<T extends string>(name: T) {
    return useTanStackSidebar(name);
}
