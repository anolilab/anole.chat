import { createCollection } from "@tanstack/react-db";
import { localStorageCollectionOptions } from "@tanstack/react-db";
import { z } from "zod";

// Sidebar state schema
export const sidebarStateSchema = z.object({
  id: z.string(),
  sidebarStates: z.record(z.string(), z.boolean()).default({}), // sidebar name -> open state
});

export type SidebarState = z.infer<typeof sidebarStateSchema>;

// Default sidebar state
const defaultSidebarState: SidebarState = {
  id: "sidebar-state",
  sidebarStates: {},
};

// Create sidebar state collection with localStorage persistence
export const sidebarStateCollection = createCollection(
  localStorageCollectionOptions({
    id: "sidebar-state",
    storageKey: "anole-sidebar-state",
    getKey: (item: SidebarState) => item.id,
    schema: sidebarStateSchema,
    initialData: [defaultSidebarState],
  })
);

// Helper functions for sidebar state management
export const sidebarStateHelpers = {
  // Get current sidebar state
  getCurrentState: (): SidebarState => {
    const state = sidebarStateCollection.toArray()[0];
    return state || defaultSidebarState;
  },

  // Get open state for a specific sidebar
  getSidebarOpenState: (sidebarName: string): boolean => {
    const state = sidebarStateHelpers.getCurrentState();
    return state.sidebarStates[sidebarName] ?? false;
  },

  // Set open state for a specific sidebar
  setSidebarOpenState: (sidebarName: string, isOpen: boolean) => {
    sidebarStateCollection.update("sidebar-state", (draft) => {
      draft.sidebarStates[sidebarName] = isOpen;
    });
  },

  // Toggle sidebar state
  toggleSidebar: (sidebarName: string) => {
    sidebarStateCollection.update("sidebar-state", (draft) => {
      const currentState = draft.sidebarStates[sidebarName] ?? false;
      draft.sidebarStates[sidebarName] = !currentState;
    });
  },

  // Set multiple sidebar states at once
  setSidebarStates: (states: Record<string, boolean>) => {
    sidebarStateCollection.update("sidebar-state", (draft) => {
      Object.assign(draft.sidebarStates, states);
    });
  },

  // Initialize sidebar states for a set of sidebar names
  initializeSidebarStates: (sidebarNames: string[], defaultOpenState: "all" | string[]) => {
    const defaultOpen = defaultOpenState === "all" ? sidebarNames : defaultOpenState;
    const states: Record<string, boolean> = {};
    
    sidebarNames.forEach((name) => {
      states[name] = defaultOpen.includes(name);
    });

    sidebarStateHelpers.setSidebarStates(states);
    return states;
  },

  // Get all sidebar states
  getAllSidebarStates: (): Record<string, boolean> => {
    const state = sidebarStateHelpers.getCurrentState();
    return state.sidebarStates;
  },

  // Reset all sidebar states
  resetSidebarStates: () => {
    sidebarStateCollection.update("sidebar-state", (draft) => {
      draft.sidebarStates = {};
    });
  },
};