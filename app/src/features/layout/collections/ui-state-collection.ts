/* eslint-disable import/exports-last */

"use client";

import { createCollection, localStorageCollectionOptions } from "@tanstack/react-db";
import { z } from "zod/v4";

const isClient = typeof window !== "undefined";

const KEY = "anole-ui-state";

const sidebarStateSchema = z
    .object({
        isMobileOpen: z.boolean().default(false),
        isOpen: z.boolean().default(false),
    })
    .strict()
    .default({ isMobileOpen: false, isOpen: false });

// Search State Schema (client-side only)
const searchStateSchema = z
    .object({
        isOpen: z.boolean().default(false),
        query: z.string().default(""),
        recentSearches: z.array(z.string()).default([]),
        type: z.enum(["threads", "messages", "global"]).default("threads"),
    })
    .strict()
    .default({ isOpen: false, query: "", recentSearches: [], type: "threads" });

// Modal State Schema (client-side only)
const modalStateSchema = z
    .object({
        data: z.unknown().optional(),
        isOpen: z.boolean().default(false),
    })
    .strict()
    .default({ isOpen: false });

// Font Settings (based on Convex userSettingsFields)
const fontSettingsSchema = z
    .object({
        codeFont: z.enum(["fira-code", "mono", "consolas", "jetbrains", "source-code-pro"]).default("fira-code"),
        mainFont: z.enum(["inter", "system", "serif", "mono", "roboto-slab"]).default("inter"),
    })
    .strict()
    .default({ codeFont: "fira-code", mainFont: "inter" });

// Keyboard Shortcuts (based on Convex userSettingsFields)
const keyboardShortcutsSchema = z
    .object({
        escape: z.string().default("Escape"),
        firstItem: z.string().default("Home"),
        focusSearch: z.string().default("Ctrl+F"),
        help: z.string().default("Ctrl+/"),
        lastItem: z.string().default("End"),
        newChat: z.string().default("Ctrl+N"),
        nextItem: z.string().default("ArrowDown"),
        prevItem: z.string().default("ArrowUp"),
        search: z.string().default("Ctrl+K"),
        sidebarLeft: z.string().default("Ctrl+B"),
        sidebarRight: z.string().default("Ctrl+Shift+B"),
    })
    .strict()
    .default({
        escape: "Escape",
        firstItem: "Home",
        focusSearch: "Ctrl+F",
        help: "Ctrl+/",
        lastItem: "End",
        newChat: "Ctrl+N",
        nextItem: "ArrowDown",
        prevItem: "ArrowUp",
        search: "Ctrl+K",
        sidebarLeft: "Ctrl+B",
        sidebarRight: "Ctrl+Shift+B",
    });

// User Preferences (based on Convex userSettingsFields + client additions)
const userPreferencesSchema = z
    .object({
        // Client-side UI preferences
        animations: z.boolean().default(true),
        autoSave: z.boolean().default(true),
        // From Convex userSettingsFields
        disableExternalLinkWarning: z.boolean().default(false),
        hidePersonalInfo: z.boolean().default(false),
        isAdvancedUser: z.boolean().default(false),
        lastChatId: z.string().optional(),
        notifications: z.boolean().default(true),
        onboardingCompleted: z.boolean().default(false),
        sendBehavior: z.enum(["enter", "shiftEnter", "button"]).default("enter"),
        showTimestamps: z.boolean().default(true),
        soundEffects: z.boolean().default(false),
    })
    .strict()
    .default({
        animations: true,
        autoSave: true,
        disableExternalLinkWarning: false,
        hidePersonalInfo: false,
        isAdvancedUser: false,
        notifications: true,
        onboardingCompleted: false,
        sendBehavior: "enter",
        showTimestamps: true,
        soundEffects: false,
    });

// Layout State Schema
const layoutStateSchema = z
    .object({
        density: z.enum(["compact", "comfortable", "spacious"]).default("comfortable"),
        fontSize: z.enum(["small", "medium", "large"]).default("medium"),
        showAvatars: z.boolean().default(true),
        showTimestamps: z.boolean().default(true),
    })
    .strict()
    .default({ density: "comfortable", fontSize: "medium", showAvatars: true, showTimestamps: true });

// Default UI state
const defaultUIState: UIState = {
    fonts: { codeFont: "fira-code", mainFont: "inter" },
    id: KEY,
    keyboardShortcuts: {
        escape: "Escape",
        firstItem: "Home",
        focusSearch: "Ctrl+F",
        help: "Ctrl+/",
        lastItem: "End",
        newChat: "Ctrl+N",
        nextItem: "ArrowDown",
        prevItem: "ArrowUp",
        search: "Ctrl+K",
        sidebarLeft: "Ctrl+B",
        sidebarRight: "Ctrl+Shift+B",
    },
    layout: { density: "comfortable", fontSize: "medium", showAvatars: true, showTimestamps: true },
    modals: {},
    preferences: {
        animations: true,
        autoSave: true,
        disableExternalLinkWarning: false,
        hidePersonalInfo: false,
        isAdvancedUser: false,
        notifications: true,
        onboardingCompleted: false,
        sendBehavior: "enter",
        showTimestamps: true,
        soundEffects: false,
    },
    search: { isOpen: false, query: "", recentSearches: [], type: "threads" },
    sidebars: {
        left: {
            isMobileOpen: false,
            isOpen: true,
        },
        right: {
            isMobileOpen: false,
            isOpen: false,
        },
    },
};

// Main UI State Schema
export const uiStateSchema = z
    .object({
        fonts: fontSettingsSchema,
        id: z.string(),
        keyboardShortcuts: keyboardShortcutsSchema,
        layout: layoutStateSchema,
        modals: z.record(z.string(), modalStateSchema).default({}),
        preferences: userPreferencesSchema,
        search: searchStateSchema,
        sidebars: z.record(z.string(), sidebarStateSchema).default({}),
    })
    .strict();

export type UIState = z.infer<typeof uiStateSchema>;
export type SidebarStateValue = z.infer<typeof sidebarStateSchema>;
export type SearchState = z.infer<typeof searchStateSchema>;
export type ModalState = z.infer<typeof modalStateSchema>;
export type FontSettings = z.infer<typeof fontSettingsSchema>;
export type KeyboardShortcuts = z.infer<typeof keyboardShortcutsSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type LayoutState = z.infer<typeof layoutStateSchema>;

export const uiStateCollection = isClient
  ? createCollection(
      localStorageCollectionOptions({
        getKey: (item: UIState) => item.id,
        id: KEY,
        schema: uiStateSchema,
        storage: globalThis.localStorage,
        storageKey: KEY,
      })
    )
  : createCollection(
      localOnlyCollectionOptions({
        getKey: (item: UIState) => item.id,
        id: KEY,
        schema: uiStateSchema,
      })
    );

// Initialize UI state collection
export const initializeUIState = (): void => {
    try {
        uiStateCollection.insert(defaultUIState);
    } catch {
        // Item might already exist, try to ensure we have the basic structure
        try {
            uiStateCollection.update(KEY, (draft) => {
                // Ensure all required fields exist with defaults
                if (!draft.sidebars) {
                    Object.assign(draft, { sidebars: {} });
                }

                if (!draft.search) {
                    Object.assign(draft, { search: defaultUIState.search });
                }

                if (!draft.modals) {
                    Object.assign(draft, { modals: {} });
                }

                if (!draft.fonts) {
                    Object.assign(draft, { fonts: defaultUIState.fonts });
                }

                if (!draft.keyboardShortcuts) {
                    Object.assign(draft, { keyboardShortcuts: defaultUIState.keyboardShortcuts });
                }

                if (!draft.preferences) {
                    Object.assign(draft, { preferences: defaultUIState.preferences });
                }

                if (!draft.layout) {
                    Object.assign(draft, { layout: defaultUIState.layout });
                }
            });
        } catch (updateError) {
            console.warn("Failed to initialize UI state collection:", updateError);
        }
    }
};

// Sidebar State Management Functions
export const setSidebarStates = (states: Record<string, SidebarStateValue>): void => {
    try {
        uiStateCollection.update(KEY, (draft) => {
            Object.assign(draft, { sidebars: { ...draft.sidebars, ...states } });
        });
    } catch {
        try {
            uiStateCollection.insert({
                ...defaultUIState,
                sidebars: states,
            });
        } catch (insertError) {
            console.warn("Failed to set sidebar states:", insertError);
        }
    }
};

export const initializeSidebarStates = (sidebarNames: string[], defaultOpenState: "all" | string[]): Record<string, SidebarStateValue> => {
    const defaultOpen = defaultOpenState === "all" ? sidebarNames : defaultOpenState;
    const states: Record<string, SidebarStateValue> = {};

    for (const name of sidebarNames) {
        states[name] = { isMobileOpen: false, isOpen: defaultOpen.includes(name) };
    }

    setSidebarStates(states);

    return states;
};

export const toggleSidebar = (sidebarName: string): void => {
    try {
        uiStateCollection.update(KEY, (draft) => {
            const previous = draft.sidebars[sidebarName] || { isMobileOpen: false, isOpen: false };

            Object.assign(draft.sidebars, { [sidebarName]: { ...previous, isOpen: !previous.isOpen } });
        });
    } catch {
        try {
            uiStateCollection.insert({
                ...defaultUIState,
                sidebars: { [sidebarName]: { isMobileOpen: false, isOpen: true } },
            });
        } catch (insertError) {
            console.warn("Failed to toggle sidebar state:", insertError);
        }
    }
};

export const resetSidebarStates = (): void => {
    try {
        uiStateCollection.update(KEY, (draft) => {
            Object.assign(draft, { sidebars: {} });
        });
    } catch (error) {
        console.warn("Failed to reset sidebar states:", error);
    }
};

// Font Settings Management Functions
export const setFonts = (fonts: Partial<FontSettings>): void => {
    try {
        uiStateCollection.update(KEY, (draft) => {
            Object.assign(draft, { fonts: { ...draft.fonts, ...fonts } });
        });
    } catch {
        try {
            uiStateCollection.insert({
                ...defaultUIState,
                fonts: { ...defaultUIState.fonts, ...fonts },
            });
        } catch (insertError) {
            console.warn("Failed to set font settings:", insertError);
        }
    }
};

// Search State Management Functions
export const setSearchState = (searchState: Partial<SearchState>): void => {
    try {
        uiStateCollection.update(KEY, (draft) => {
            Object.assign(draft, { search: { ...draft.search, ...searchState } });
        });
    } catch {
        try {
            uiStateCollection.insert({
                ...defaultUIState,
                search: { ...defaultUIState.search, ...searchState },
            });
        } catch (insertError) {
            console.warn("Failed to set search state:", insertError);
        }
    }
};

export const addRecentSearch = (query: string): void => {
    if (!query.trim())
        return;

    try {
        uiStateCollection.update(KEY, (draft) => {
            const recentSearches = draft.search.recentSearches || [];
            const filteredSearches = recentSearches.filter((search) => search !== query);

            Object.assign(draft.search, { recentSearches: [query, ...filteredSearches].slice(0, 10) });
        });
    } catch (error) {
        console.warn("Failed to add recent search:", error);
    }
};

export const clearRecentSearches = (): void => {
    try {
        uiStateCollection.update(KEY, (draft) => {
            Object.assign(draft.search, { recentSearches: [] });
        });
    } catch (error) {
        console.warn("Failed to clear recent searches:", error);
    }
};

// Modal State Management Functions
export const setModalState = (modalName: string, state: Partial<ModalState>): void => {
    try {
        uiStateCollection.update(KEY, (draft) => {
            const previous = draft.modals[modalName] || { isOpen: false };

            Object.assign(draft.modals, { [modalName]: { ...previous, ...state } });
        });
    } catch {
        try {
            uiStateCollection.insert({
                ...defaultUIState,
                modals: { [modalName]: { isOpen: false, ...state } },
            });
        } catch (insertError) {
            console.warn("Failed to set modal state:", insertError);
        }
    }
};

export const openModal = (modalName: string, data?: unknown): void => {
    setModalState(modalName, { data, isOpen: true });
};

export const closeModal = (modalName: string): void => {
    setModalState(modalName, { data: undefined, isOpen: false });
};

export const closeAllModals = (): void => {
    try {
        uiStateCollection.update(KEY, (draft) => {
            for (const modalName of Object.keys(draft.modals)) {
                Object.assign(draft.modals, { [modalName]: { data: undefined, isOpen: false } });
            }
        });
    } catch (error) {
        console.warn("Failed to close all modals:", error);
    }
};

// Layout State Management Functions
export const setLayoutState = (layout: Partial<LayoutState>): void => {
    try {
        uiStateCollection.update(KEY, (draft) => {
            Object.assign(draft, { layout: { ...draft.layout, ...layout } });
        });
    } catch {
        try {
            uiStateCollection.insert({
                ...defaultUIState,
                layout: { ...defaultUIState.layout, ...layout },
            });
        } catch (insertError) {
            console.warn("Failed to set layout state:", insertError);
        }
    }
};

// User Preferences Management Functions
export const setUserPreferences = (preferences: Partial<UserPreferences>): void => {
    try {
        uiStateCollection.update(KEY, (draft) => {
            Object.assign(draft, { preferences: { ...draft.preferences, ...preferences } });
        });
    } catch {
        try {
            uiStateCollection.insert({
                ...defaultUIState,
                preferences: { ...defaultUIState.preferences, ...preferences },
            });
        } catch (insertError) {
            console.warn("Failed to set user preferences:", insertError);
        }
    }
};

// Keyboard Shortcuts Management Functions
export const setKeyboardShortcuts = (shortcuts: Partial<KeyboardShortcuts>): void => {
    try {
        uiStateCollection.update(KEY, (draft) => {
            Object.assign(draft, { keyboardShortcuts: { ...draft.keyboardShortcuts, ...shortcuts } });
        });
    } catch {
        try {
            uiStateCollection.insert({
                ...defaultUIState,
                keyboardShortcuts: { ...defaultUIState.keyboardShortcuts, ...shortcuts },
            });
        } catch (insertError) {
            console.warn("Failed to set keyboard shortcuts:", insertError);
        }
    }
};

// Reset Functions
export const resetUIState = (): void => {
    try {
        uiStateCollection.update(KEY, () => {
            return { ...defaultUIState };
        });
    } catch (error) {
        console.warn("Failed to reset UI state:", error);
    }
};

export const resetFonts = (): void => {
    setFonts(defaultUIState.fonts);
};

export const resetLayout = (): void => {
    setLayoutState(defaultUIState.layout);
};

export const resetUserPreferences = (): void => {
    setUserPreferences(defaultUIState.preferences);
};

export const resetKeyboardShortcuts = (): void => {
    setKeyboardShortcuts(defaultUIState.keyboardShortcuts);
};

if (isClient) {
    initializeUIState();
}
