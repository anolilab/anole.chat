import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "@tanstack/react-db";

import { keyboardShortcutsCollection, keyboardShortcutsHelpers } from "../collections/keyboard-shortcuts-collection";
import { useTodos, useBulkTodoOperations, useTodoFilters, useSelectedTodos } from "../../todos/hooks/use-todos";
import { todoUIStateHelpers } from "../../todos/collections/ui-state-collection";

export const useTodoKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const { createTodo, deleteTodo, toggleTodoComplete } = useTodos();
  const { 
    deleteSelected, 
    markSelectedComplete, 
    setPriorityForSelected,
    duplicateSelected 
  } = useBulkTodoOperations();
  const { setFilter, setViewMode } = useTodoFilters();
  const { selectedTodos, selectAll, clearSelection } = useSelectedTodos();
  
  // Get current shortcuts configuration
  const { data: shortcuts } = useLiveQuery((q) =>
    q.from({ shortcuts: keyboardShortcutsCollection }).select(({ shortcuts }) => shortcuts)
  );

  const currentShortcuts = shortcuts?.[0] || keyboardShortcutsHelpers.getCurrentShortcuts();

  // Track focused todo for navigation
  const focusedTodoRef = useRef<string | null>(null);
  const focusedElementRef = useRef<HTMLElement | null>(null);

  const handleKeyboardShortcut = useCallback(async (event: KeyboardEvent) => {
    // Don't handle shortcuts when typing in inputs (except for specific cases)
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );

    // Handle shortcuts that should work even in inputs
    const globalShortcuts = ['escape', 'help', 'search'];
    const isGlobalShortcut = Object.entries(currentShortcuts).some(([key, shortcut]) =>
      globalShortcuts.includes(key) && keyboardShortcutsHelpers.matchesShortcut(event, shortcut)
    );

    if (isInputFocused && !isGlobalShortcut) {
      // Only handle quick add and escape in inputs
      if (keyboardShortcutsHelpers.matchesShortcut(event, currentShortcuts.quickAdd)) {
        event.preventDefault();
        const inputValue = (activeElement as HTMLInputElement).value?.trim();
        if (inputValue) {
          await createTodo({ title: inputValue });
          (activeElement as HTMLInputElement).value = '';
        }
        return;
      }
      return;
    }

    // Handle all shortcuts
    for (const [action, shortcut] of Object.entries(currentShortcuts)) {
      if (keyboardShortcutsHelpers.matchesShortcut(event, shortcut)) {
        event.preventDefault();
        await handleShortcutAction(action as keyof typeof currentShortcuts, event);
        break;
      }
    }
  }, [currentShortcuts, createTodo, deleteTodo, toggleTodoComplete, deleteSelected, markSelectedComplete, setPriorityForSelected, duplicateSelected, setFilter, setViewMode, selectedTodos, selectAll, clearSelection, navigate]);

  const handleShortcutAction = async (action: keyof typeof currentShortcuts, event: KeyboardEvent) => {
    switch (action) {
      // Navigation shortcuts
      case 'newTodo':
        todoUIStateHelpers.toggleQuickAdd();
        // Focus the quick add input if it exists
        setTimeout(() => {
          const quickAddInput = document.querySelector('[data-testid="quick-add-input"]') as HTMLInputElement;
          if (quickAddInput) {
            quickAddInput.focus();
          }
        }, 100);
        break;

      case 'quickAdd':
        todoUIStateHelpers.toggleQuickAdd();
        break;

      case 'focusSearch':
        const searchInput = document.querySelector('[data-testid="todo-search-input"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        break;

      // Todo operations
      case 'toggleComplete':
        if (focusedTodoRef.current) {
          await toggleTodoComplete(focusedTodoRef.current);
        } else if (selectedTodos.length > 0) {
          await markSelectedComplete();
        }
        break;

      case 'deleteTodo':
        if (selectedTodos.length > 0) {
          await deleteSelected();
        } else if (focusedTodoRef.current) {
          await deleteTodo(focusedTodoRef.current);
        }
        break;

      case 'editTodo':
        if (focusedTodoRef.current) {
          const todoElement = document.querySelector(`[data-todo-id="${focusedTodoRef.current}"]`);
          const editButton = todoElement?.querySelector('[data-testid="edit-todo-button"]') as HTMLButtonElement;
          if (editButton) {
            editButton.click();
          }
        }
        break;

      // Selection
      case 'selectAll':
        selectAll();
        break;

      case 'clearSelection':
        clearSelection();
        break;

      // Navigation
      case 'nextTodo':
        navigateToNextTodo();
        break;

      case 'prevTodo':
        navigateToPrevTodo();
        break;

      case 'firstTodo':
        navigateToFirstTodo();
        break;

      case 'lastTodo':
        navigateToLastTodo();
        break;

      // Filters
      case 'showAll':
        setFilter('all');
        break;

      case 'showActive':
        setFilter('active');
        break;

      case 'showCompleted':
        setFilter('completed');
        break;

      // Views
      case 'listView':
        setViewMode('list');
        break;

      case 'gridView':
        setViewMode('grid');
        break;

      case 'kanbanView':
        setViewMode('kanban');
        break;

      // Priorities
      case 'setPriorityHigh':
        if (selectedTodos.length > 0) {
          await setPriorityForSelected('high');
        } else if (focusedTodoRef.current) {
          // Update focused todo priority
          const { updateTodo } = useTodos();
          await updateTodo(focusedTodoRef.current, { priority: 'high' });
        }
        break;

      case 'setPriorityMedium':
        if (selectedTodos.length > 0) {
          await setPriorityForSelected('medium');
        } else if (focusedTodoRef.current) {
          const { updateTodo } = useTodos();
          await updateTodo(focusedTodoRef.current, { priority: 'medium' });
        }
        break;

      case 'setPriorityLow':
        if (selectedTodos.length > 0) {
          await setPriorityForSelected('low');
        } else if (focusedTodoRef.current) {
          const { updateTodo } = useTodos();
          await updateTodo(focusedTodoRef.current, { priority: 'low' });
        }
        break;

      // Bulk operations
      case 'markAllComplete':
        await markSelectedComplete();
        break;

      case 'deleteSelected':
        if (selectedTodos.length > 0) {
          await deleteSelected();
        }
        break;

      case 'duplicateSelected':
        if (selectedTodos.length > 0) {
          await duplicateSelected();
        } else if (focusedTodoRef.current) {
          const { duplicateTodo } = useTodos();
          await duplicateTodo(focusedTodoRef.current);
        }
        break;

      // Export/Import
      case 'exportTodos':
        // Trigger export functionality
        const exportButton = document.querySelector('[data-testid="export-todos-button"]') as HTMLButtonElement;
        if (exportButton) {
          exportButton.click();
        }
        break;

      case 'importTodos':
        // Trigger import functionality
        const importButton = document.querySelector('[data-testid="import-todos-button"]') as HTMLButtonElement;
        if (importButton) {
          importButton.click();
        }
        break;

      // Categories
      case 'toggleCategories':
        todoUIStateHelpers.toggleSidebar('right');
        break;

      // Existing shortcuts (delegate to original handler)
      case 'sidebarLeft':
        todoUIStateHelpers.toggleSidebar('left');
        break;

      case 'sidebarRight':
        todoUIStateHelpers.toggleSidebar('right');
        break;

      case 'newChat':
        navigate({ to: '/chat/new' });
        break;

      case 'search':
        const globalSearchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (globalSearchInput) {
          globalSearchInput.focus();
        }
        break;

      case 'help':
        const helpButton = document.querySelector('[data-testid="help-button"]') as HTMLButtonElement;
        if (helpButton) {
          helpButton.click();
        }
        break;

      case 'escape':
        // Clear selection, close modals, blur inputs
        clearSelection();
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          activeElement.blur();
        }
        // Close any open dialogs
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        break;

      default:
        console.log('Unhandled todo keyboard shortcut:', action);
    }
  };

  // Navigation helpers
  const navigateToNextTodo = () => {
    const todoElements = Array.from(document.querySelectorAll('[data-todo-id]'));
    if (todoElements.length === 0) return;

    let currentIndex = -1;
    if (focusedTodoRef.current) {
      currentIndex = todoElements.findIndex(el => 
        el.getAttribute('data-todo-id') === focusedTodoRef.current
      );
    }

    const nextIndex = (currentIndex + 1) % todoElements.length;
    const nextElement = todoElements[nextIndex] as HTMLElement;
    focusedTodoRef.current = nextElement.getAttribute('data-todo-id');
    nextElement.focus();
    focusedElementRef.current = nextElement;
  };

  const navigateToPrevTodo = () => {
    const todoElements = Array.from(document.querySelectorAll('[data-todo-id]'));
    if (todoElements.length === 0) return;

    let currentIndex = todoElements.length;
    if (focusedTodoRef.current) {
      currentIndex = todoElements.findIndex(el => 
        el.getAttribute('data-todo-id') === focusedTodoRef.current
      );
    }

    const prevIndex = currentIndex <= 0 ? todoElements.length - 1 : currentIndex - 1;
    const prevElement = todoElements[prevIndex] as HTMLElement;
    focusedTodoRef.current = prevElement.getAttribute('data-todo-id');
    prevElement.focus();
    focusedElementRef.current = prevElement;
  };

  const navigateToFirstTodo = () => {
    const todoElements = Array.from(document.querySelectorAll('[data-todo-id]'));
    if (todoElements.length === 0) return;

    const firstElement = todoElements[0] as HTMLElement;
    focusedTodoRef.current = firstElement.getAttribute('data-todo-id');
    firstElement.focus();
    focusedElementRef.current = firstElement;
  };

  const navigateToLastTodo = () => {
    const todoElements = Array.from(document.querySelectorAll('[data-todo-id]'));
    if (todoElements.length === 0) return;

    const lastElement = todoElements[todoElements.length - 1] as HTMLElement;
    focusedTodoRef.current = lastElement.getAttribute('data-todo-id');
    lastElement.focus();
    focusedElementRef.current = lastElement;
  };

  // Set up keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut);
    
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, [handleKeyboardShortcut]);

  // Track focus changes
  useEffect(() => {
    const handleFocusChange = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      const todoId = target.closest('[data-todo-id]')?.getAttribute('data-todo-id');
      
      if (todoId) {
        focusedTodoRef.current = todoId;
        focusedElementRef.current = target;
      }
    };

    document.addEventListener('focusin', handleFocusChange);
    
    return () => {
      document.removeEventListener('focusin', handleFocusChange);
    };
  }, []);

  return {
    currentShortcuts,
    focusedTodo: focusedTodoRef.current,
    setFocusedTodo: (todoId: string) => {
      focusedTodoRef.current = todoId;
    },
  };
};