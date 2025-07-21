import { createCollection } from "@tanstack/react-db";
import { localStorageCollectionOptions } from "@tanstack/react-db";
import { z } from "zod";

// UI State schema for todo list interface
export const todoUIStateSchema = z.object({
  id: z.string(),
  // Filter settings
  filter: z.enum(["all", "active", "completed"]).default("all"),
  search: z.string().default(""),
  selectedCategory: z.string().optional(),
  selectedPriority: z.enum(["low", "medium", "high"]).optional(),
  
  // Sort settings  
  sortBy: z.enum(["createdAt", "updatedAt", "title", "priority", "dueDate", "order"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  
  // View settings
  viewMode: z.enum(["list", "grid", "kanban"]).default("list"),
  showCompleted: z.boolean().default(true),
  showCategories: z.boolean().default(true),
  showPriorities: z.boolean().default(true),
  
  // Selection state
  selectedTodos: z.array(z.string()).default([]),
  
  // Sidebar states
  leftSidebarOpen: z.boolean().default(true),
  rightSidebarOpen: z.boolean().default(false),
  
  // Quick add state
  quickAddVisible: z.boolean().default(false),
});

export type TodoUIState = z.infer<typeof todoUIStateSchema>;

// Default UI state
const defaultUIState: TodoUIState = {
  id: "todo-ui-state",
  filter: "all",
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
  viewMode: "list",
  showCompleted: true,
  showCategories: true,
  showPriorities: true,
  selectedTodos: [],
  leftSidebarOpen: true,
  rightSidebarOpen: false,
  quickAddVisible: false,
};

// Create UI state collection with localStorage persistence
export const todoUIStateCollection = createCollection(
  localStorageCollectionOptions({
    id: "todo-ui-state",
    storageKey: "anole-todo-ui-state",
    getKey: (item: TodoUIState) => item.id,
    schema: todoUIStateSchema,
    initialData: [defaultUIState],
  })
);

// Helper functions for common UI state operations
export const todoUIStateHelpers = {
  // Get current UI state
  getCurrentState: (): TodoUIState => {
    const state = todoUIStateCollection.toArray()[0];
    return state || defaultUIState;
  },

  // Update filter
  setFilter: (filter: TodoUIState["filter"]) => {
    todoUIStateCollection.update("todo-ui-state", (draft) => {
      draft.filter = filter;
    });
  },

  // Update search
  setSearch: (search: string) => {
    todoUIStateCollection.update("todo-ui-state", (draft) => {
      draft.search = search;
    });
  },

  // Update sort
  setSort: (sortBy: TodoUIState["sortBy"], sortOrder: TodoUIState["sortOrder"]) => {
    todoUIStateCollection.update("todo-ui-state", (draft) => {
      draft.sortBy = sortBy;
      draft.sortOrder = sortOrder;
    });
  },

  // Update view mode
  setViewMode: (viewMode: TodoUIState["viewMode"]) => {
    todoUIStateCollection.update("todo-ui-state", (draft) => {
      draft.viewMode = viewMode;
    });
  },

  // Toggle sidebar
  toggleSidebar: (side: "left" | "right") => {
    todoUIStateCollection.update("todo-ui-state", (draft) => {
      if (side === "left") {
        draft.leftSidebarOpen = !draft.leftSidebarOpen;
      } else {
        draft.rightSidebarOpen = !draft.rightSidebarOpen;
      }
    });
  },

  // Update selected todos
  setSelectedTodos: (selectedTodos: string[]) => {
    todoUIStateCollection.update("todo-ui-state", (draft) => {
      draft.selectedTodos = selectedTodos;
    });
  },

  // Toggle todo selection
  toggleTodoSelection: (todoId: string) => {
    todoUIStateCollection.update("todo-ui-state", (draft) => {
      const index = draft.selectedTodos.indexOf(todoId);
      if (index > -1) {
        draft.selectedTodos.splice(index, 1);
      } else {
        draft.selectedTodos.push(todoId);
      }
    });
  },

  // Clear selection
  clearSelection: () => {
    todoUIStateCollection.update("todo-ui-state", (draft) => {
      draft.selectedTodos = [];
    });
  },

  // Toggle quick add
  toggleQuickAdd: () => {
    todoUIStateCollection.update("todo-ui-state", (draft) => {
      draft.quickAddVisible = !draft.quickAddVisible;
    });
  },

  // Reset to defaults
  reset: () => {
    todoUIStateCollection.update("todo-ui-state", (draft) => {
      Object.assign(draft, defaultUIState);
    });
  },
};