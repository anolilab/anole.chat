import { useLiveQuery } from "@tanstack/react-db";
import React, { useCallback, useEffect, useMemo } from "react";

import type { KeyboardShortcuts } from "@/features/layout/collections/ui-state-collection";
import { useKeyboardShortcuts as useUIKeyboardShortcuts } from "@/features/layout/hooks/use-ui-state";

// Context for keyboard shortcuts
interface KeyboardShortcutsContextType {
    matchesShortcut: (event: KeyboardEvent, shortcutString: string) => boolean;
    parseShortcut: (shortcutString: string) => KeyboardShortcut;
    shortcuts: KeyboardShortcuts;
    updateShortcuts: (shortcuts: Partial<KeyboardShortcuts>) => void;
}

const KeyboardShortcutsContext = React.createContext<KeyboardShortcutsContextType | undefined>(undefined);

export interface KeyboardShortcut {
    altKey?: boolean;
    ctrlKey?: boolean;
    key: string;
    metaKey?: boolean;
    shiftKey?: boolean;
}

// Export types for compatibility
export type KeyboardShortcutsConfig = KeyboardShortcuts;

// Helper functions for parsing and matching shortcuts
const parseShortcut = (shortcutString: string): KeyboardShortcut => {
    const parts = shortcutString.split("+");
    const result: KeyboardShortcut = {
        altKey: false,
        ctrlKey: false,
        key: parts[parts.length - 1] || "", // Last part is the key, fallback to empty string
        metaKey: false,
        shiftKey: false,
    };

    for (const part of parts.slice(0, -1)) {
        const normalizedPart = part.toLowerCase();

        switch (normalizedPart) {
            case "alt": {
                result.altKey = true;

                break;
            }
            case "cmd":
            case "command":
            case "meta": {
                result.metaKey = true;

                break;
            }
            case "control":
            case "ctrl": {
                result.ctrlKey = true;

                break;
            }
            case "shift": {
                result.shiftKey = true;

                break;
            }
        // No default
        }
    }

    return result;
};

const matchesShortcut = (event: KeyboardEvent, shortcutString: string): boolean => {
    const shortcut = parseShortcut(shortcutString);

    return (
        event.key === shortcut.key
        && event.ctrlKey === (shortcut.ctrlKey || false)
        && event.shiftKey === (shortcut.shiftKey || false)
        && event.altKey === (shortcut.altKey || false)
        && event.metaKey === (shortcut.metaKey || false)
    );
};

export const KeyboardShortcutsManager: React.FC<{
    children: React.ReactNode;
    onShortcut?: (action: keyof KeyboardShortcutsConfig, event: KeyboardEvent) => void;
    shortcuts?: Partial<KeyboardShortcutsConfig>;
}> = ({ children, onShortcut, shortcuts: propertyShortcuts }) => {
    // Get keyboard shortcuts from UI state collection
    const uiKeyboardShortcuts = useUIKeyboardShortcuts();

    // Merge user settings with prop overrides
    const effectiveShortcuts = useMemo(() => {
        return {
            ...uiKeyboardShortcuts,
            ...propertyShortcuts,
        };
    }, [uiKeyboardShortcuts, propertyShortcuts]);

    // Handle keyboard events
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Don't handle shortcuts if user is typing in an input
            if (
                event.target instanceof HTMLInputElement
                || event.target instanceof HTMLTextAreaElement
                || event.target instanceof HTMLSelectElement
                || (event.target as HTMLElement)?.contentEditable === "true"
            ) {
                return;
            }

            // Check each shortcut
            for (const [action, shortcutString] of Object.entries(effectiveShortcuts)) {
                if (action === "setKeyboardShortcuts" || action === "resetKeyboardShortcuts" || action === "setShortcut") {
                    continue; // Skip action functions
                }

                if (shortcutString && typeof shortcutString === "string" && matchesShortcut(event, shortcutString)) {
                    event.preventDefault();
                    onShortcut?.(action as keyof KeyboardShortcutsConfig, event);
                    break; // Only handle the first match
                }
            }
        },
        [effectiveShortcuts, onShortcut],
    );

    // Add event listener
    useEffect(() => {
        globalThis.addEventListener("keydown", handleKeyDown);

        return () => globalThis.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Update shortcuts using UI state collection
    const updateShortcuts = useCallback(
        (newShortcuts: Partial<KeyboardShortcutsConfig>) => {
            uiKeyboardShortcuts.setKeyboardShortcuts(newShortcuts);
        },
        [uiKeyboardShortcuts],
    );

    // Context value for child components
    const contextValue = useMemo(() => {
        return {
            matchesShortcut,
            parseShortcut,
            shortcuts: effectiveShortcuts,
            updateShortcuts,
        };
    }, [effectiveShortcuts, updateShortcuts]);

    return <KeyboardShortcutsContext value={contextValue}>{children}</KeyboardShortcutsContext>;
};

export const useKeyboardShortcuts = (): KeyboardShortcutsContextType => {
    const context = React.use(KeyboardShortcutsContext);

    if (!context) {
        throw new Error("useKeyboardShortcuts must be used within KeyboardShortcutsManager");
    }

    return context;
};

// Hook for specific shortcut actions
export const useShortcut = (action: keyof KeyboardShortcutsConfig): string | undefined => {
    const { shortcuts } = useKeyboardShortcuts();
    const shortcutValue = shortcuts[action];

    // Filter out function properties and return only string shortcuts
    return typeof shortcutValue === "string" ? shortcutValue : undefined;
};
