import { createCollection } from "@tanstack/react-db";
import { localStorageCollectionOptions } from "@tanstack/react-db";
import { z } from "zod";

// Extended keyboard shortcuts schema including todo-specific shortcuts
export const extendedKeyboardShortcutsSchema = z.object({
  id: z.string(),
  
  // Existing shortcuts (from the current system)
  sidebarLeft: z.string().default("Ctrl+B"),
  sidebarRight: z.string().default("Ctrl+Shift+B"),
  newChat: z.string().default("Ctrl+N"),
  search: z.string().default("Ctrl+K"),
  help: z.string().default("Ctrl+/"),
  escape: z.string().default("Escape"),
  
  // Todo-specific shortcuts
  newTodo: z.string().default("Ctrl+Shift+N"),
  quickAdd: z.string().default("Ctrl+Enter"),
  toggleComplete: z.string().default("Space"),
  deleteTodo: z.string().default("Delete"),
  editTodo: z.string().default("Enter"),
  selectAll: z.string().default("Ctrl+A"),
  clearSelection: z.string().default("Escape"),
  
  // Navigation shortcuts
  focusSearch: z.string().default("Ctrl+F"),
  nextTodo: z.string().default("ArrowDown"),
  prevTodo: z.string().default("ArrowUp"),
  firstTodo: z.string().default("Home"),
  lastTodo: z.string().default("End"),
  
  // Filter shortcuts
  showAll: z.string().default("Ctrl+1"),
  showActive: z.string().default("Ctrl+2"),
  showCompleted: z.string().default("Ctrl+3"),
  
  // View shortcuts
  listView: z.string().default("Ctrl+Shift+1"),
  gridView: z.string().default("Ctrl+Shift+2"),
  kanbanView: z.string().default("Ctrl+Shift+3"),
  
  // Priority shortcuts
  setPriorityHigh: z.string().default("Ctrl+Shift+H"),
  setPriorityMedium: z.string().default("Ctrl+Shift+M"),
  setPriorityLow: z.string().default("Ctrl+Shift+L"),
  
  // Bulk operations
  markAllComplete: z.string().default("Ctrl+Shift+C"),
  deleteSelected: z.string().default("Ctrl+Delete"),
  duplicateSelected: z.string().default("Ctrl+D"),
  
  // Export/Import
  exportTodos: z.string().default("Ctrl+E"),
  importTodos: z.string().default("Ctrl+I"),
  
  // Categories
  toggleCategories: z.string().default("Ctrl+G"),
  
  // Undo/Redo
  undo: z.string().default("Ctrl+Z"),
  redo: z.string().default("Ctrl+Y"),
});

export type ExtendedKeyboardShortcuts = z.infer<typeof extendedKeyboardShortcutsSchema>;

// Default shortcuts configuration
const defaultShortcuts: ExtendedKeyboardShortcuts = {
  id: "keyboard-shortcuts",
  
  // Existing shortcuts
  sidebarLeft: "Ctrl+B",
  sidebarRight: "Ctrl+Shift+B", 
  newChat: "Ctrl+N",
  search: "Ctrl+K",
  help: "Ctrl+/",
  escape: "Escape",
  
  // Todo-specific shortcuts
  newTodo: "Ctrl+Shift+N",
  quickAdd: "Ctrl+Enter",
  toggleComplete: "Space",
  deleteTodo: "Delete",
  editTodo: "Enter",
  selectAll: "Ctrl+A",
  clearSelection: "Escape",
  
  // Navigation
  focusSearch: "Ctrl+F",
  nextTodo: "ArrowDown",
  prevTodo: "ArrowUp", 
  firstTodo: "Home",
  lastTodo: "End",
  
  // Filters
  showAll: "Ctrl+1",
  showActive: "Ctrl+2",
  showCompleted: "Ctrl+3",
  
  // Views
  listView: "Ctrl+Shift+1",
  gridView: "Ctrl+Shift+2",
  kanbanView: "Ctrl+Shift+3",
  
  // Priorities
  setPriorityHigh: "Ctrl+Shift+H",
  setPriorityMedium: "Ctrl+Shift+M",
  setPriorityLow: "Ctrl+Shift+L",
  
  // Bulk operations
  markAllComplete: "Ctrl+Shift+C",
  deleteSelected: "Ctrl+Delete",
  duplicateSelected: "Ctrl+D",
  
  // Export/Import
  exportTodos: "Ctrl+E",
  importTodos: "Ctrl+I",
  
  // Categories
  toggleCategories: "Ctrl+G",
  
  // Undo/Redo
  undo: "Ctrl+Z",
  redo: "Ctrl+Y",
};

// Create keyboard shortcuts collection
export const keyboardShortcutsCollection = createCollection(
  localStorageCollectionOptions({
    id: "keyboard-shortcuts",
    storageKey: "anole-keyboard-shortcuts",
    getKey: (item: ExtendedKeyboardShortcuts) => item.id,
    schema: extendedKeyboardShortcutsSchema,
    initialData: [defaultShortcuts],
  })
);

// Helper functions for managing keyboard shortcuts
export const keyboardShortcutsHelpers = {
  // Get current shortcuts
  getCurrentShortcuts: (): ExtendedKeyboardShortcuts => {
    const shortcuts = keyboardShortcutsCollection.toArray()[0];
    return shortcuts || defaultShortcuts;
  },

  // Update a specific shortcut
  updateShortcut: (key: keyof ExtendedKeyboardShortcuts, value: string) => {
    keyboardShortcutsCollection.update("keyboard-shortcuts", (draft) => {
      (draft as any)[key] = value;
    });
  },

  // Update multiple shortcuts
  updateShortcuts: (updates: Partial<ExtendedKeyboardShortcuts>) => {
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
  resetShortcut: (key: keyof ExtendedKeyboardShortcuts) => {
    keyboardShortcutsCollection.update("keyboard-shortcuts", (draft) => {
      (draft as any)[key] = (defaultShortcuts as any)[key];
    });
  },

  // Check if shortcut is duplicate
  isDuplicateShortcut: (shortcut: string, excludeKey?: keyof ExtendedKeyboardShortcuts): boolean => {
    const current = keyboardShortcutsHelpers.getCurrentShortcuts();
    const entries = Object.entries(current) as [keyof ExtendedKeyboardShortcuts, string][];
    
    return entries.some(([key, value]) => 
      key !== "id" && 
      key !== excludeKey && 
      value === shortcut && 
      value.trim() !== ""
    );
  },

  // Get shortcut description
  getShortcutDescription: (key: keyof ExtendedKeyboardShortcuts): string => {
    const descriptions: Record<keyof ExtendedKeyboardShortcuts, string> = {
      id: "",
      sidebarLeft: "Toggle left sidebar",
      sidebarRight: "Toggle right sidebar",
      newChat: "Start new chat",
      search: "Open search",
      help: "Show help",
      escape: "Close dialogs/cancel actions",
      newTodo: "Create new todo",
      quickAdd: "Quick add todo",
      toggleComplete: "Toggle todo completion",
      deleteTodo: "Delete selected todo",
      editTodo: "Edit selected todo",
      selectAll: "Select all todos",
      clearSelection: "Clear selection",
      focusSearch: "Focus search input",
      nextTodo: "Navigate to next todo",
      prevTodo: "Navigate to previous todo",
      firstTodo: "Go to first todo",
      lastTodo: "Go to last todo",
      showAll: "Show all todos",
      showActive: "Show active todos",
      showCompleted: "Show completed todos",
      listView: "Switch to list view",
      gridView: "Switch to grid view",
      kanbanView: "Switch to kanban view",
      setPriorityHigh: "Set priority to high",
      setPriorityMedium: "Set priority to medium",
      setPriorityLow: "Set priority to low",
      markAllComplete: "Mark all todos as complete",
      deleteSelected: "Delete selected todos",
      duplicateSelected: "Duplicate selected todos",
      exportTodos: "Export todos",
      importTodos: "Import todos",
      toggleCategories: "Toggle categories panel",
      undo: "Undo last action",
      redo: "Redo last action",
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