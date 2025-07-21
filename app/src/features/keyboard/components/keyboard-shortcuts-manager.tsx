import { useLiveQuery } from "@tanstack/react-db";
import React, { useCallback, useEffect, useMemo } from "react";
import { keyboardShortcutsCollection, keyboardShortcutsHelpers, type KeyboardShortcuts } from "../collections/keyboard-shortcuts-collection";

// Context for keyboard shortcuts
interface KeyboardShortcutsContextType {
    matchesShortcut: (event: KeyboardEvent, shortcutString: string) => boolean;
    parseShortcut: (shortcutString: string) => KeyboardShortcut;
    shortcuts: KeyboardShortcuts;
    updateShortcuts: (shortcuts: Partial<KeyboardShortcuts>) => Promise<void>;
}

const KeyboardShortcutsContext = React.createContext<KeyboardShortcutsContextType | null>(null);

export interface KeyboardShortcut {
    altKey?: boolean;
    ctrlKey?: boolean;
    key: string;
    metaKey?: boolean;
    shiftKey?: boolean;
}

// Export types for compatibility
export type KeyboardShortcutsConfig = KeyboardShortcuts;

export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcuts = {
    id: "keyboard-shortcuts",
    escape: "Escape",
    help: "Ctrl+/",
    newChat: "Ctrl+N",
    search: "Ctrl+K",
    sidebarLeft: "Ctrl+B",
    sidebarRight: "Ctrl+Shift+B",
    focusSearch: "Ctrl+F",
    nextItem: "ArrowDown",
    prevItem: "ArrowUp",
    firstItem: "Home",
    lastItem: "End",
};

export const KeyboardShortcutsManager: React.FC<{
    children: React.ReactNode;
    onShortcut?: (action: keyof KeyboardShortcutsConfig, event: KeyboardEvent) => void;
    shortcuts?: Partial<KeyboardShortcutsConfig>;
}> = ({ children, onShortcut, shortcuts }) => {
    // Get keyboard shortcuts from TanStack DB
    const { data: shortcutsData } = useLiveQuery((q) =>
        q.from({ shortcuts: keyboardShortcutsCollection }).select(({ shortcuts }) => shortcuts)
    );

    const userShortcuts = shortcutsData?.[0] || keyboardShortcutsHelpers.getCurrentShortcuts();

    // Merge user settings with defaults and props
    const effectiveShortcuts = useMemo(() => {
        return {
            ...DEFAULT_KEYBOARD_SHORTCUTS,
            ...userShortcuts,
            ...shortcuts,
        };
    }, [userShortcuts, shortcuts]);

    // Use TanStack DB helpers for parsing and matching shortcuts
    const parseShortcut = useCallback((shortcutString: string): KeyboardShortcut => {
        const parsed = keyboardShortcutsHelpers.parseShortcut(shortcutString);
        return {
            altKey: parsed.altKey,
            ctrlKey: parsed.ctrlKey,
            key: parsed.key,
            metaKey: parsed.metaKey,
            shiftKey: parsed.shiftKey,
        };
    }, []);

    // Use TanStack DB helper for matching shortcuts
    const matchesShortcut = useCallback(
        (event: KeyboardEvent, shortcutString: string): boolean => {
            return keyboardShortcutsHelpers.matchesShortcut(event, shortcutString);
        },
        [],
    );

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
            Object.entries(effectiveShortcuts).forEach(([action, shortcutString]) => {
                if (shortcutString && matchesShortcut(event, shortcutString)) {
                    event.preventDefault();
                    onShortcut?.(action as keyof KeyboardShortcutsConfig, event);
                }
            });
        },
        [effectiveShortcuts, matchesShortcut, onShortcut],
    );

    // Add event listener
    useEffect(() => {
        globalThis.addEventListener("keydown", handleKeyDown);

        return () => globalThis.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Update shortcuts using TanStack DB
    const updateShortcuts = useCallback(
        async (newShortcuts: Partial<KeyboardShortcutsConfig>) => {
            keyboardShortcutsHelpers.updateShortcuts(newShortcuts);
        },
        [],
    );

    // Context value for child components
    const contextValue = useMemo(() => {
        return {
            matchesShortcut,
            parseShortcut,
            shortcuts: effectiveShortcuts,
            updateShortcuts,
        };
    }, [effectiveShortcuts, updateShortcuts, parseShortcut, matchesShortcut]);

    return <KeyboardShortcutsContext value={contextValue}>{children}</KeyboardShortcutsContext>;
};

export const useKeyboardShortcuts = () => {
    const context = React.use(KeyboardShortcutsContext);

    if (!context) {
        throw new Error("useKeyboardShortcuts must be used within KeyboardShortcutsManager");
    }

    return context;
};

// Hook for specific shortcut actions
export const useShortcut = (action: keyof KeyboardShortcutsConfig) => {
    const { shortcuts } = useKeyboardShortcuts();

    return shortcuts[action];
};
