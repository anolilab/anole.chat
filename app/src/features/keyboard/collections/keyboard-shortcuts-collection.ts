import { createCollection } from "@tanstack/react-db";
import { localStorageCollectionOptions } from "@tanstack/react-db";
import { z } from "zod";

// Core keyboard shortcuts schema for the app
export const keyboardShortcutsSchema = z.object({
  id: z.string(),
  
  // Core app shortcuts
  sidebarLeft: z.string().default("Ctrl+B"),
  sidebarRight: z.string().default("Ctrl+Shift+B"),
  newChat: z.string().default("Ctrl+N"),
  search: z.string().default("Ctrl+K"),
  help: z.string().default("Ctrl+/"),
  escape: z.string().default("Escape"),
  
  // Navigation shortcuts
  focusSearch: z.string().default("Ctrl+F"),
  nextItem: z.string().default("ArrowDown"),
  prevItem: z.string().default("ArrowUp"),
  firstItem: z.string().default("Home"),
  lastItem: z.string().default("End"),
});

export type KeyboardShortcuts = z.infer<typeof keyboardShortcutsSchema>;

// Default shortcuts configuration
const defaultShortcuts: KeyboardShortcuts = {
  id: "keyboard-shortcuts",
  
  // Core app shortcuts
  sidebarLeft: "Ctrl+B",
  sidebarRight: "Ctrl+Shift+B", 
  newChat: "Ctrl+N",
  search: "Ctrl+K",
  help: "Ctrl+/",
  escape: "Escape",
  
  // Navigation
  focusSearch: "Ctrl+F",
  nextItem: "ArrowDown",
  prevItem: "ArrowUp", 
  firstItem: "Home",
  lastItem: "End",
};

// Create keyboard shortcuts collection
export const keyboardShortcutsCollection = createCollection(
  localStorageCollectionOptions({
    id: "keyboard-shortcuts",
    storageKey: "anole-keyboard-shortcuts",
    getKey: (item: KeyboardShortcuts) => item.id,
    schema: keyboardShortcutsSchema,
    initialData: [defaultShortcuts],
  })
);

// Helper functions for managing keyboard shortcuts
export const keyboardShortcutsHelpers = {
  // Get current shortcuts
  getCurrentShortcuts: (): KeyboardShortcuts => {
    const shortcuts = keyboardShortcutsCollection.toArray()[0];
    return shortcuts || defaultShortcuts;
  },

  // Update a specific shortcut
  updateShortcut: (key: keyof KeyboardShortcuts, value: string) => {
    keyboardShortcutsCollection.update("keyboard-shortcuts", (draft) => {
      (draft as any)[key] = value;
    });
  },

  // Update multiple shortcuts
  updateShortcuts: (updates: Partial<KeyboardShortcuts>) => {
    keyboardShortcutsCollection.update("keyboard-shortcuts", (draft) => {
      Object.assign(draft, updates);
    });
  },

  // Reset to defaults
  resetToDefaults: () => {
    keyboardShortcutsCollection.update("keyboard-shortcuts", (draft) => {
      Object.assign(draft, defaultShortcuts);
    });
  },

  // Reset specific shortcut to default
  resetShortcut: (key: keyof KeyboardShortcuts) => {
    keyboardShortcutsCollection.update("keyboard-shortcuts", (draft) => {
      (draft as any)[key] = (defaultShortcuts as any)[key];
    });
  },

  // Check if shortcut is duplicate
  isDuplicateShortcut: (shortcut: string, excludeKey?: keyof KeyboardShortcuts): boolean => {
    const current = keyboardShortcutsHelpers.getCurrentShortcuts();
    const entries = Object.entries(current) as [keyof KeyboardShortcuts, string][];
    
    return entries.some(([key, value]) => 
      key !== "id" && 
      key !== excludeKey && 
      value === shortcut && 
      value.trim() !== ""
    );
  },

  // Get shortcut description
  getShortcutDescription: (key: keyof KeyboardShortcuts): string => {
    const descriptions: Record<keyof KeyboardShortcuts, string> = {
      id: "",
      sidebarLeft: "Toggle left sidebar",
      sidebarRight: "Toggle right sidebar",
      newChat: "Start new chat",
      search: "Open search",
      help: "Show help",
      escape: "Close dialogs/cancel actions",
      focusSearch: "Focus search input",
      nextItem: "Navigate to next item",
      prevItem: "Navigate to previous item",
      firstItem: "Go to first item",
      lastItem: "Go to last item",
    };

    return descriptions[key] || "";
  },

  // Parse shortcut string to key combination
  parseShortcut: (shortcut: string): {
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    key: string;
  } => {
    const parts = shortcut.split("+");
    const result = {
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      key: "",
    };

    parts.forEach(part => {
      switch (part.toLowerCase()) {
        case "ctrl":
          result.ctrlKey = true;
          break;
        case "cmd":
        case "meta":
          result.metaKey = true;
          break;
        case "shift":
          result.shiftKey = true;
          break;
        case "alt":
          result.altKey = true;
          break;
        default:
          result.key = part;
          break;
      }
    });

    return result;
  },

  // Check if keyboard event matches shortcut
  matchesShortcut: (event: KeyboardEvent, shortcut: string): boolean => {
    if (!shortcut.trim()) return false;
    
    const parsed = keyboardShortcutsHelpers.parseShortcut(shortcut);
    
    return (
      event.ctrlKey === parsed.ctrlKey &&
      event.metaKey === parsed.metaKey &&
      event.shiftKey === parsed.shiftKey &&
      event.altKey === parsed.altKey &&
      (event.key === parsed.key || event.code === parsed.key)
    );
  },
};