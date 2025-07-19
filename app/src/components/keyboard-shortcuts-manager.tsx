import React, { useCallback, useEffect, useMemo } from "react";
import { useConvexQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useSidebar } from "@anole/ui/components/sidebar";

export interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
}

export interface KeyboardShortcutsConfig {
    sidebarLeft?: string;
    sidebarRight?: string;
    newChat?: string;
    search?: string;
    help?: string;
    escape?: string;
}

export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcutsConfig = {
    sidebarLeft: "b",
    sidebarRight: "l",
    newChat: "n",
    search: "k",
    help: "?",
    escape: "Escape",
};

interface KeyboardShortcutsManagerProps {
    children: React.ReactNode;
    onShortcut?: (action: keyof KeyboardShortcutsConfig, event: KeyboardEvent) => void;
    shortcuts?: Partial<KeyboardShortcutsConfig>;
    sidebarNames?: string[];
}

export const KeyboardShortcutsManager: React.FC<KeyboardShortcutsManagerProps> = ({
    children,
    onShortcut,
    shortcuts,
    sidebarNames = ["left", "right"],
}) => {
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
            key,
            ctrlKey: parts.includes("ctrl"),
            metaKey: parts.includes("cmd") || parts.includes("meta"),
            shiftKey: parts.includes("shift"),
            altKey: parts.includes("alt"),
        };
    }, []);

    // Check if keyboard event matches a shortcut
    const matchesShortcut = useCallback((event: KeyboardEvent, shortcutString: string): boolean => {
        const shortcut = parseShortcut(shortcutString);
        
        return (
            event.key.toLowerCase() === shortcut.key &&
            !!event.ctrlKey === !!shortcut.ctrlKey &&
            !!event.metaKey === !!shortcut.metaKey &&
            !!event.shiftKey === !!shortcut.shiftKey &&
            !!event.altKey === !!shortcut.altKey
        );
    }, [parseShortcut]);

    // Handle keyboard events
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Don't handle shortcuts if user is typing in an input
        if (
            event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLTextAreaElement ||
            event.target instanceof HTMLSelectElement ||
            (event.target as HTMLElement)?.contentEditable === "true"
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
    }, [effectiveShortcuts, matchesShortcut, onShortcut]);

    // Add event listener
    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Update user settings with new shortcuts
    const updateShortcuts = useCallback(async (newShortcuts: Partial<KeyboardShortcutsConfig>) => {
        const currentShortcuts = userSettings?.keyboardShortcuts || {};
        const updatedShortcuts = { ...currentShortcuts, ...newShortcuts };
        
        await updateUserSettings({ keyboardShortcuts: updatedShortcuts });
    }, [userSettings?.keyboardShortcuts, updateUserSettings]);

    // Context value for child components
    const contextValue = useMemo(() => ({
        shortcuts: effectiveShortcuts,
        updateShortcuts,
        parseShortcut,
        matchesShortcut,
    }), [effectiveShortcuts, updateShortcuts, parseShortcut, matchesShortcut]);

    return (
        <KeyboardShortcutsContext.Provider value={contextValue}>
            {children}
        </KeyboardShortcutsContext.Provider>
    );
};

// Context for keyboard shortcuts
interface KeyboardShortcutsContextType {
    shortcuts: KeyboardShortcutsConfig;
    updateShortcuts: (shortcuts: Partial<KeyboardShortcutsConfig>) => Promise<void>;
    parseShortcut: (shortcutString: string) => KeyboardShortcut;
    matchesShortcut: (event: KeyboardEvent, shortcutString: string) => boolean;
}

const KeyboardShortcutsContext = React.createContext<KeyboardShortcutsContextType | null>(null);

export const useKeyboardShortcuts = () => {
    const context = React.useContext(KeyboardShortcutsContext);
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