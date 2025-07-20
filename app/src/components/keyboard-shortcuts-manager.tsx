import { api } from "@anole/convex/api";
import { useMutation, useQuery as useConvexQuery } from "convex/react";
import React, { useCallback, useEffect, useMemo } from "react";

// Context for keyboard shortcuts
interface KeyboardShortcutsContextType {
    matchesShortcut: (event: KeyboardEvent, shortcutString: string) => boolean;
    parseShortcut: (shortcutString: string) => KeyboardShortcut;
    shortcuts: KeyboardShortcutsConfig;
    updateShortcuts: (shortcuts: Partial<KeyboardShortcutsConfig>) => Promise<void>;
}

const KeyboardShortcutsContext = React.createContext<KeyboardShortcutsContextType | null>(null);

export interface KeyboardShortcut {
    altKey?: boolean;
    ctrlKey?: boolean;
    key: string;
    metaKey?: boolean;
    shiftKey?: boolean;
}

export interface KeyboardShortcutsConfig {
    escape?: string;
    help?: string;
    newChat?: string;
    search?: string;
    sidebarLeft?: string;
    sidebarRight?: string;
}

export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcutsConfig = {
    escape: "Escape",
    help: "?",
    newChat: "n",
    search: "k",
    sidebarLeft: "b",
    sidebarRight: "l",
};

export const KeyboardShortcutsManager: React.FC<{
    children: React.ReactNode;
    onShortcut?: (action: keyof KeyboardShortcutsConfig, event: KeyboardEvent) => void;
    shortcuts?: Partial<KeyboardShortcutsConfig>;
}> = ({ children, onShortcut, shortcuts }) => {
    const userSettings = useConvexQuery(api.auth.functions.getUserSettings);
    const updateUserSettings = useMutation(api.auth.functions.updateUserSettings);

    // Merge user settings with defaults and props
    const effectiveShortcuts = useMemo(() => {
        const userShortcuts = userSettings?.keyboardShortcuts || {};

        return {
            ...DEFAULT_KEYBOARD_SHORTCUTS,
            ...userShortcuts,
            ...shortcuts,
        };
    }, [userSettings?.keyboardShortcuts, shortcuts]);

    // Parse shortcut string into KeyboardShortcut object
    const parseShortcut = useCallback((shortcutString: string): KeyboardShortcut => {
        const parts = shortcutString.toLowerCase().split("+");
        const key = parts[parts.length - 1];

        return {
            altKey: parts.includes("alt"),
            ctrlKey: parts.includes("ctrl"),
            key,
            metaKey: parts.includes("cmd") || parts.includes("meta"),
            shiftKey: parts.includes("shift"),
        };
    }, []);

    // Check if keyboard event matches a shortcut
    const matchesShortcut = useCallback(
        (event: KeyboardEvent, shortcutString: string): boolean => {
            const shortcut = parseShortcut(shortcutString);

            return (
                event.key.toLowerCase() === shortcut.key
                && !!event.ctrlKey === !!shortcut.ctrlKey
                && !!event.metaKey === !!shortcut.metaKey
                && !!event.shiftKey === !!shortcut.shiftKey
                && !!event.altKey === !!shortcut.altKey
            );
        },
        [parseShortcut],
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

    // Update user settings with new shortcuts
    const updateShortcuts = useCallback(
        async (newShortcuts: Partial<KeyboardShortcutsConfig>) => {
            const currentShortcuts = userSettings?.keyboardShortcuts || {};
            const updatedShortcuts = { ...currentShortcuts, ...newShortcuts };

            await updateUserSettings({ keyboardShortcuts: updatedShortcuts });
        },
        [userSettings?.keyboardShortcuts, updateUserSettings],
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
