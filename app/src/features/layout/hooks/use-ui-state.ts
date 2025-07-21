"use client";

import { useLiveQuery } from "@tanstack/react-db";
import { useMemo } from "react";

import type { FontSettings, KeyboardShortcuts, LayoutState, SearchState, SidebarStateValue, UserPreferences } from "../collections/ui-state-collection";
import {
    addRecentSearch,
    clearRecentSearches,
    closeAllModals,
    closeModal,
    openModal,
    resetFonts,
    resetKeyboardShortcuts,
    resetLayout,
    resetSidebarStates,
    resetUIState,
    resetUserPreferences,
    setFonts,
    setKeyboardShortcuts,
    setLayoutState,
    setModalState,
    setSearchState,
    setSidebarStates,
    setUserPreferences,
    toggleSidebar,
    uiStateCollection,
} from "../collections/ui-state-collection";

export const useUIState = () => {
    const { data: uiStateArray } = useLiveQuery((q) => q.from({ uiState: uiStateCollection }));

    const uiState = useMemo(() => uiStateArray?.[0] || null, [uiStateArray]);

    return {
        actions: {
            addRecentSearch,
            clearRecentSearches,
            closeAllModals,
            closeModal,
            openModal,
            resetFonts,
            resetKeyboardShortcuts,
            resetLayout,
            resetSidebarStates,
            resetUIState,
            resetUserPreferences,
            setFonts,
            setKeyboardShortcuts,
            setLayoutState,
            setModalState,
            setSearchState,
            setSidebarStates,
            setUserPreferences,
            toggleSidebar,
        },
        fonts: uiState?.fonts || { codeFont: "fira-code" as const, mainFont: "inter" as const },
        isLoading: !uiState,
        keyboardShortcuts: uiState?.keyboardShortcuts || {
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
        layout: uiState?.layout || { density: "comfortable" as const, fontSize: "medium" as const, showAvatars: true, showTimestamps: true },
        modals: uiState?.modals || {},
        preferences: uiState?.preferences || {
            animations: true,
            autoSave: true,
            disableExternalLinkWarning: false,
            hidePersonalInfo: false,
            isAdvancedUser: false,
            notifications: true,
            onboardingCompleted: false,
            sendBehavior: "enter" as const,
            showTimestamps: true,
            soundEffects: false,
        },
        search: uiState?.search || { isOpen: false, query: "", recentSearches: [], type: "threads" as const },
        // Direct access to state sections
        sidebars: uiState?.sidebars || {},
        uiState,
    };
};

// Specific hooks for individual state sections
export const useSidebarState = (sidebarName?: string) => {
    const { actions, sidebars } = useUIState();

    if (sidebarName) {
        const sidebarState = sidebars[sidebarName] || { isMobileOpen: false, isOpen: false };

        return {
            ...sidebarState,
            setState: (state: Partial<SidebarStateValue>) => actions.setSidebarStates({ [sidebarName]: { ...sidebarState, ...state } }),
            toggle: () => actions.toggleSidebar(sidebarName),
        };
    }

    return {
        resetSidebarStates: actions.resetSidebarStates,
        setSidebarStates: actions.setSidebarStates,
        sidebars,
        toggleSidebar: actions.toggleSidebar,
    };
};

export const useFontSettings = () => {
    const { actions, fonts } = useUIState();

    return {
        ...fonts,
        resetFonts: actions.resetFonts,
        setCodeFont: (codeFont: FontSettings["codeFont"]) => actions.setFonts({ codeFont }),
        setFonts: actions.setFonts,
        setMainFont: (mainFont: FontSettings["mainFont"]) => actions.setFonts({ mainFont }),
    };
};

export const useSearchState = () => {
    const { actions, search } = useUIState();

    return {
        ...search,
        addRecentSearch: actions.addRecentSearch,
        clearRecentSearches: actions.clearRecentSearches,
        closeSearch: () => actions.setSearchState({ isOpen: false }),
        openSearch: () => actions.setSearchState({ isOpen: true }),
        setQuery: (query: string) => actions.setSearchState({ query }),
        setSearchState: actions.setSearchState,
        setType: (type: SearchState["type"]) => actions.setSearchState({ type }),
    };
};

export const useModalState = (modalName?: string) => {
    const { actions, modals } = useUIState();

    if (modalName) {
        const modalState = modals[modalName] || { isOpen: false };

        return {
            ...modalState,
            close: () => actions.closeModal(modalName),
            open: (data?: unknown) => actions.openModal(modalName, data),
            toggle: (data?: unknown) => {
                if (modalState.isOpen) {
                    actions.closeModal(modalName);
                } else {
                    actions.openModal(modalName, data);
                }
            },
        };
    }

    return {
        closeAllModals: actions.closeAllModals,
        closeModal: actions.closeModal,
        modals,
        openModal: actions.openModal,
        setModalState: actions.setModalState,
    };
};

export const useLayoutState = () => {
    const { actions, layout } = useUIState();

    return {
        ...layout,
        resetLayout: actions.resetLayout,
        setDensity: (density: LayoutState["density"]) => actions.setLayoutState({ density }),
        setFontSize: (fontSize: LayoutState["fontSize"]) => actions.setLayoutState({ fontSize }),
        setLayoutState: actions.setLayoutState,
        setShowAvatars: (showAvatars: boolean) => actions.setLayoutState({ showAvatars }),
        setShowTimestamps: (showTimestamps: boolean) => actions.setLayoutState({ showTimestamps }),
    };
};

export const useUserPreferences = () => {
    const { actions, preferences } = useUIState();

    return {
        ...preferences,
        resetUserPreferences: actions.resetUserPreferences,
        // Client-side preferences
        setAnimations: (animations: boolean) => actions.setUserPreferences({ animations }),
        setAutoSave: (autoSave: boolean) => actions.setUserPreferences({ autoSave }),
        // Convex-based preferences
        setDisableExternalLinkWarning: (disableExternalLinkWarning: boolean) => actions.setUserPreferences({ disableExternalLinkWarning }),
        setHidePersonalInfo: (hidePersonalInfo: boolean) => actions.setUserPreferences({ hidePersonalInfo }),
        setIsAdvancedUser: (isAdvancedUser: boolean) => actions.setUserPreferences({ isAdvancedUser }),
        setLastChatId: (lastChatId?: string) => actions.setUserPreferences({ lastChatId }),
        setNotifications: (notifications: boolean) => actions.setUserPreferences({ notifications }),
        setOnboardingCompleted: (onboardingCompleted: boolean) => actions.setUserPreferences({ onboardingCompleted }),
        setSendBehavior: (sendBehavior: UserPreferences["sendBehavior"]) => actions.setUserPreferences({ sendBehavior }),
        setShowTimestamps: (showTimestamps: boolean) => actions.setUserPreferences({ showTimestamps }),
        setSoundEffects: (soundEffects: boolean) => actions.setUserPreferences({ soundEffects }),
        setUserPreferences: actions.setUserPreferences,
    };
};

export const useKeyboardShortcuts = () => {
    const { actions, keyboardShortcuts } = useUIState();

    return {
        ...keyboardShortcuts,
        resetKeyboardShortcuts: actions.resetKeyboardShortcuts,
        setEscape: (shortcut: string) => actions.setKeyboardShortcuts({ escape: shortcut }),
        setHelp: (shortcut: string) => actions.setKeyboardShortcuts({ help: shortcut }),
        setKeyboardShortcuts: actions.setKeyboardShortcuts,
        setNewChat: (shortcut: string) => actions.setKeyboardShortcuts({ newChat: shortcut }),
        setSearch: (shortcut: string) => actions.setKeyboardShortcuts({ search: shortcut }),
        setShortcut: (key: keyof KeyboardShortcuts, shortcut: string) => actions.setKeyboardShortcuts({ [key]: shortcut }),
        // Specific shortcut setters
        setSidebarLeft: (shortcut: string) => actions.setKeyboardShortcuts({ sidebarLeft: shortcut }),
        setSidebarRight: (shortcut: string) => actions.setKeyboardShortcuts({ sidebarRight: shortcut }),
    };
};

// Utility hook for checking if UI state is ready
export const useUIStateReady = () => {
    const { isLoading } = useUIState();

    return !isLoading;
};
