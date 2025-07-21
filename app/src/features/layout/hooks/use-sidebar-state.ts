import { useLiveQuery } from "@tanstack/react-db";
import { useCallback } from "react";
import { sidebarStateCollection, sidebarStateHelpers } from "../collections/sidebar-state-collection";

export type SidebarStateType = {
  isMobileOpen: boolean;
  isOpen: boolean;
};

export const useSidebarState = <T extends string>(sidebarNames: ReadonlyArray<T>) => {
  // Get reactive sidebar state from TanStack DB
  const { data: sidebarState } = useLiveQuery((q) =>
    q.from({ state: sidebarStateCollection }).select(({ state }) => state)
  );

  const currentState = sidebarState?.[0] || sidebarStateHelpers.getCurrentState();

  // Get sidebar states for all registered sidebars
  const getSidebarStates = useCallback((): Record<T, SidebarStateType> => {
    const states: Record<T, SidebarStateType> = {} as Record<T, SidebarStateType>;
    
    sidebarNames.forEach((name) => {
      const isOpen = currentState.sidebarStates[name] ?? false;
      states[name] = {
        isMobileOpen: false, // Mobile state is handled separately as it's not persistent
        isOpen,
      };
    });

    return states;
  }, [currentState.sidebarStates, sidebarNames]);

  // Toggle a specific sidebar
  const toggleSidebar = useCallback((name: T) => {
    sidebarStateHelpers.toggleSidebar(name);
  }, []);

  // Set sidebar state
  const setSidebarState = useCallback((
    name: T,
    state: Partial<SidebarStateType> | ((prev: SidebarStateType) => Partial<SidebarStateType>)
  ) => {
    const currentSidebarState = getSidebarStates()[name] ?? { isMobileOpen: false, isOpen: false };
    const newState = typeof state === 'function' ? state(currentSidebarState) : state;
    
    // Only persist the 'isOpen' state, not mobile state
    if ('isOpen' in newState && newState.isOpen !== undefined) {
      sidebarStateHelpers.setSidebarOpenState(name, newState.isOpen);
    }
  }, [getSidebarStates]);

  // Initialize sidebar states with default values
  const initializeSidebarStates = useCallback((defaultOpenState: "all" | T[]) => {
    return sidebarStateHelpers.initializeSidebarStates(
      sidebarNames as string[], 
      defaultOpenState as "all" | string[]
    );
  }, [sidebarNames]);

  // Get open sidebar names
  const getOpenSidebarNames = useCallback((): T[] => {
    const states = getSidebarStates();
    return Object.entries(states)
      .filter(([_, state]) => (state as SidebarStateType).isOpen)
      .map(([name]) => name as T);
  }, [getSidebarStates]);

  return {
    // State
    sidebarStates: getSidebarStates(),
    currentState,
    
    // Actions
    toggleSidebar,
    setSidebarState,
    initializeSidebarStates,
    
    // Utilities
    getOpenSidebarNames,
    isOpen: (name: T) => getSidebarStates()[name]?.isOpen ?? false,
    helpers: sidebarStateHelpers,
  };
};