import { useLiveQuery } from "@tanstack/react-db";
import { useCallback } from "react";
import { nanoid } from "nanoid";

import { todoCollection, type Todo } from "../collections/todo-collection";
import { 
  filteredTodosCollection,
  activeTodosCollection,
  completedTodosCollection,
  highPriorityTodosCollection,
  overdueTodosCollection,
  todaysTodosCollection,
  selectedTodosCollection,
  todoStatsCollection,
} from "../collections/derived-collections";
import { todoUIStateHelpers } from "../collections/ui-state-collection";

// Main hook for working with todos
export const useTodos = () => {
  // Get filtered todos based on current UI state
  const { data: todos = [] } = useLiveQuery((q) => 
    q.from({ todo: filteredTodosCollection }).select(({ todo }) => todo)
  );

  // Get all todos (unfiltered)
  const { data: allTodos = [] } = useLiveQuery((q) =>
    q.from({ todo: todoCollection }).select(({ todo }) => todo)
  );

  // Todo operations
  const createTodo = useCallback(async (todoData: Partial<Todo>) => {
    const now = new Date();
    const newTodo: Todo = {
      id: nanoid(),
      title: todoData.title || "",
      description: todoData.description,
      completed: false,
      priority: todoData.priority || "medium",
      category: todoData.category,
      dueDate: todoData.dueDate,
      createdAt: now,
      updatedAt: now,
      tags: todoData.tags || [],
      order: todoData.order || allTodos.length,
    };

    return todoCollection.insert(newTodo);
  }, [allTodos.length]);

  const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    return todoCollection.update(id, (draft) => {
      Object.assign(draft, updates);
      draft.updatedAt = new Date();
    });
  }, []);

  const deleteTodo = useCallback(async (id: string) => {
    return todoCollection.delete(id);
  }, []);

  const toggleTodoComplete = useCallback(async (id: string) => {
    return todoCollection.update(id, (draft) => {
      draft.completed = !draft.completed;
      draft.updatedAt = new Date();
    });
  }, []);

  const duplicateTodo = useCallback(async (id: string) => {
    const originalTodo = allTodos.find(t => t.id === id);
    if (!originalTodo) return;

    const now = new Date();
    const duplicatedTodo: Todo = {
      ...originalTodo,
      id: nanoid(),
      title: `${originalTodo.title} (Copy)`,
      completed: false,
      createdAt: now,
      updatedAt: now,
      order: allTodos.length,
    };

    return todoCollection.insert(duplicatedTodo);
  }, [allTodos]);

  const reorderTodos = useCallback(async (todoIds: string[]) => {
    const updates = todoIds.map((id, index) => ({
      id,
      order: index,
    }));

    await Promise.all(
      updates.map(({ id, order }) =>
        todoCollection.update(id, (draft) => {
          draft.order = order;
          draft.updatedAt = new Date();
        })
      )
    );
  }, []);

  return {
    todos,
    allTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodoComplete,
    duplicateTodo,
    reorderTodos,
  };
};

// Hook for active todos
export const useActiveTodos = () => {
  const { data: activeTodos = [] } = useLiveQuery((q) =>
    q.from({ todo: activeTodosCollection }).select(({ todo }) => todo)
  );

  return { activeTodos };
};

// Hook for completed todos
export const useCompletedTodos = () => {
  const { data: completedTodos = [] } = useLiveQuery((q) =>
    q.from({ todo: completedTodosCollection }).select(({ todo }) => todo)
  );

  return { completedTodos };
};

// Hook for high priority todos
export const useHighPriorityTodos = () => {
  const { data: highPriorityTodos = [] } = useLiveQuery((q) =>
    q.from({ todo: highPriorityTodosCollection }).select(({ todo }) => todo)
  );

  return { highPriorityTodos };
};

// Hook for overdue todos
export const useOverdueTodos = () => {
  const { data: overdueTodos = [] } = useLiveQuery((q) =>
    q.from({ todo: overdueTodosCollection }).select(({ todo }) => todo)
  );

  return { overdueTodos };
};

// Hook for today's todos
export const useTodaysTodos = () => {
  const { data: todaysTodos = [] } = useLiveQuery((q) =>
    q.from({ todo: todaysTodosCollection }).select(({ todo }) => todo)
  );

  return { todaysTodos };
};

// Hook for selected todos
export const useSelectedTodos = () => {
  const { data: selectedTodos = [] } = useLiveQuery((q) =>
    q.from({ todo: selectedTodosCollection }).select(({ todo }) => todo)
  );

  const selectTodo = useCallback((todoId: string) => {
    todoUIStateHelpers.toggleTodoSelection(todoId);
  }, []);

  const selectMultipleTodos = useCallback((todoIds: string[]) => {
    todoUIStateHelpers.setSelectedTodos(todoIds);
  }, []);

  const clearSelection = useCallback(() => {
    todoUIStateHelpers.clearSelection();
  }, []);

  const selectAll = useCallback(() => {
    const { allTodos } = useTodos();
    todoUIStateHelpers.setSelectedTodos(allTodos.map(t => t.id));
  }, []);

  return {
    selectedTodos,
    selectTodo,
    selectMultipleTodos,
    clearSelection,
    selectAll,
  };
};

// Hook for todo statistics
export const useTodoStats = () => {
  const { data: stats } = useLiveQuery((q) =>
    q.from({ stats: todoStatsCollection }).select(({ stats }) => stats)
  );

  return { stats: stats?.[0] };
};

// Hook for bulk operations
export const useBulkTodoOperations = () => {
  const { selectedTodos } = useSelectedTodos();

  const deleteSelected = useCallback(async () => {
    await Promise.all(
      selectedTodos.map(todo => todoCollection.delete(todo.id))
    );
    todoUIStateHelpers.clearSelection();
  }, [selectedTodos]);

  const markSelectedComplete = useCallback(async () => {
    await Promise.all(
      selectedTodos.map(todo => 
        todoCollection.update(todo.id, (draft) => {
          draft.completed = true;
          draft.updatedAt = new Date();
        })
      )
    );
    todoUIStateHelpers.clearSelection();
  }, [selectedTodos]);

  const markSelectedIncomplete = useCallback(async () => {
    await Promise.all(
      selectedTodos.map(todo =>
        todoCollection.update(todo.id, (draft) => {
          draft.completed = false;
          draft.updatedAt = new Date();
        })
      )
    );
    todoUIStateHelpers.clearSelection();
  }, [selectedTodos]);

  const setPriorityForSelected = useCallback(async (priority: Todo["priority"]) => {
    await Promise.all(
      selectedTodos.map(todo =>
        todoCollection.update(todo.id, (draft) => {
          draft.priority = priority;
          draft.updatedAt = new Date();
        })
      )
    );
    todoUIStateHelpers.clearSelection();
  }, [selectedTodos]);

  const setCategoryForSelected = useCallback(async (category: string) => {
    await Promise.all(
      selectedTodos.map(todo =>
        todoCollection.update(todo.id, (draft) => {
          draft.category = category;
          draft.updatedAt = new Date();
        })
      )
    );
    todoUIStateHelpers.clearSelection();
  }, [selectedTodos]);

  const duplicateSelected = useCallback(async () => {
    const now = new Date();
    const duplicates = selectedTodos.map(todo => ({
      ...todo,
      id: nanoid(),
      title: `${todo.title} (Copy)`,
      completed: false,
      createdAt: now,
      updatedAt: now,
    }));

    await Promise.all(
      duplicates.map(todo => todoCollection.insert(todo))
    );
    
    todoUIStateHelpers.clearSelection();
  }, [selectedTodos]);

  return {
    deleteSelected,
    markSelectedComplete,
    markSelectedIncomplete,
    setPriorityForSelected,
    setCategoryForSelected,
    duplicateSelected,
    selectedCount: selectedTodos.length,
  };
};

// Hook for search and filtering
export const useTodoFilters = () => {
  const setFilter = useCallback((filter: "all" | "active" | "completed") => {
    todoUIStateHelpers.setFilter(filter);
  }, []);

  const setSearch = useCallback((search: string) => {
    todoUIStateHelpers.setSearch(search);
  }, []);

  const setSort = useCallback((
    sortBy: "createdAt" | "updatedAt" | "title" | "priority" | "dueDate" | "order",
    sortOrder: "asc" | "desc"
  ) => {
    todoUIStateHelpers.setSort(sortBy, sortOrder);
  }, []);

  const setViewMode = useCallback((viewMode: "list" | "grid" | "kanban") => {
    todoUIStateHelpers.setViewMode(viewMode);
  }, []);

  return {
    setFilter,
    setSearch,
    setSort,
    setViewMode,
  };
};

// Hook for categories
export const useTodoCategories = () => {
  const { allTodos } = useTodos();
  
  const categories = Array.from(
    new Set(allTodos.map(todo => todo.category).filter(Boolean))
  ).sort();

  const getCategoryStats = useCallback((category: string) => {
    const categoryTodos = allTodos.filter(todo => todo.category === category);
    return {
      total: categoryTodos.length,
      completed: categoryTodos.filter(todo => todo.completed).length,
      active: categoryTodos.filter(todo => !todo.completed).length,
    };
  }, [allTodos]);

  return {
    categories,
    getCategoryStats,
  };
};