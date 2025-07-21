import { createLiveQueryCollection, eq, and, or, desc, asc } from "@tanstack/db";
import { todoCollection, type Todo } from "./todo-collection";
import { todoUIStateCollection, type TodoUIState } from "./ui-state-collection";

// Filtered todos based on UI state
export const filteredTodosCollection = createLiveQueryCollection({
  startSync: true,
  query: (q) => {
    return q
      .from({ todo: todoCollection, uiState: todoUIStateCollection })
      .select(({ todo, uiState }) => {
        const state = uiState as TodoUIState;
        let filteredTodos = [todo] as Todo[];

        // Apply completion filter
        switch (state.filter) {
          case "active":
            filteredTodos = filteredTodos.filter(t => !t.completed);
            break;
          case "completed":
            filteredTodos = filteredTodos.filter(t => t.completed);
            break;
          case "all":
          default:
            // Show all todos
            break;
        }

        // Apply search filter
        if (state.search.trim()) {
          const searchLower = state.search.toLowerCase();
          filteredTodos = filteredTodos.filter(t => 
            t.title.toLowerCase().includes(searchLower) ||
            (t.description && t.description.toLowerCase().includes(searchLower)) ||
            (t.category && t.category.toLowerCase().includes(searchLower)) ||
            t.tags.some(tag => tag.toLowerCase().includes(searchLower))
          );
        }

        // Apply category filter
        if (state.selectedCategory) {
          filteredTodos = filteredTodos.filter(t => t.category === state.selectedCategory);
        }

        // Apply priority filter
        if (state.selectedPriority) {
          filteredTodos = filteredTodos.filter(t => t.priority === state.selectedPriority);
        }

        // Apply sorting
        filteredTodos.sort((a, b) => {
          let comparison = 0;
          
          switch (state.sortBy) {
            case "title":
              comparison = a.title.localeCompare(b.title);
              break;
            case "priority":
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
              break;
            case "dueDate":
              if (!a.dueDate && !b.dueDate) comparison = 0;
              else if (!a.dueDate) comparison = 1;
              else if (!b.dueDate) comparison = -1;
              else comparison = a.dueDate.getTime() - b.dueDate.getTime();
              break;
            case "order":
              comparison = a.order - b.order;
              break;
            case "updatedAt":
              comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
              break;
            case "createdAt":
            default:
              comparison = a.createdAt.getTime() - b.createdAt.getTime();
              break;
          }

          return state.sortOrder === "desc" ? -comparison : comparison;
        });

        return filteredTodos;
      });
  },
});

// Active todos only (not completed)
export const activeTodosCollection = createLiveQueryCollection({
  startSync: true,
  query: (q) =>
    q
      .from({ todo: todoCollection })
      .where(({ todo }) => eq(todo.completed, false))
      .orderBy(({ todo }) => todo.createdAt, "desc"),
});

// Completed todos only
export const completedTodosCollection = createLiveQueryCollection({
  startSync: true,
  query: (q) =>
    q
      .from({ todo: todoCollection })
      .where(({ todo }) => eq(todo.completed, true))
      .orderBy(({ todo }) => todo.updatedAt, "desc"),
});

// High priority todos
export const highPriorityTodosCollection = createLiveQueryCollection({
  startSync: true,
  query: (q) =>
    q
      .from({ todo: todoCollection })
      .where(({ todo }) => and(
        eq(todo.priority, "high"),
        eq(todo.completed, false)
      ))
      .orderBy(({ todo }) => todo.dueDate || todo.createdAt, "asc"),
});

// Overdue todos
export const overdueTodosCollection = createLiveQueryCollection({
  startSync: true,
  query: (q) => {
    const now = new Date();
    return q
      .from({ todo: todoCollection })
      .select(({ todo }) => {
        return todo.dueDate && todo.dueDate < now && !todo.completed ? [todo] : [];
      });
  },
});

// Today's todos (due today)
export const todaysTodosCollection = createLiveQueryCollection({
  startSync: true,
  query: (q) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return q
      .from({ todo: todoCollection })
      .select(({ todo }) => {
        return todo.dueDate && 
               todo.dueDate >= today && 
               todo.dueDate < tomorrow && 
               !todo.completed ? [todo] : [];
      });
  },
});

// Todos by category
export const todosByCategoryCollection = createLiveQueryCollection({
  startSync: true,
  query: (q) =>
    q
      .from({ todo: todoCollection })
      .select(({ todo }) => {
        // Group todos by category
        const categories = new Map<string, Todo[]>();
        
        const category = todo.category || "Uncategorized";
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        categories.get(category)!.push(todo);
        
        return Array.from(categories.entries()).map(([category, todos]) => ({
          category,
          todos: todos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
          count: todos.length,
          completedCount: todos.filter(t => t.completed).length,
        }));
      }),
});

// Selected todos (based on UI state)
export const selectedTodosCollection = createLiveQueryCollection({
  startSync: true,
  query: (q) =>
    q
      .from({ todo: todoCollection, uiState: todoUIStateCollection })
      .select(({ todo, uiState }) => {
        const state = uiState as TodoUIState;
        return state.selectedTodos.includes(todo.id) ? [todo] : [];
      }),
});

// Statistics collection
export const todoStatsCollection = createLiveQueryCollection({
  startSync: true,
  query: (q) =>
    q
      .from({ todo: todoCollection })
      .select(({ todo }) => {
        const todos = [todo] as Todo[];
        
        return [{
          id: "stats",
          total: todos.length,
          completed: todos.filter(t => t.completed).length,
          active: todos.filter(t => !t.completed).length,
          highPriority: todos.filter(t => t.priority === "high" && !t.completed).length,
          overdue: todos.filter(t => {
            const now = new Date();
            return t.dueDate && t.dueDate < now && !t.completed;
          }).length,
          dueToday: todos.filter(t => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return t.dueDate && t.dueDate >= today && t.dueDate < tomorrow && !t.completed;
          }).length,
          categories: [...new Set(todos.map(t => t.category).filter(Boolean))].length,
          averageCompletionTime: 0, // Can be calculated based on createdAt and updatedAt
        }];
      }),
});