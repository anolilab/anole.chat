import { Badge } from "@anole/ui/components/badge";
import { Button } from "@anole/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@anole/ui/components/card";
import { Checkbox } from "@anole/ui/components/checkbox";
import { Input } from "@anole/ui/components/input";
import { Separator } from "@anole/ui/components/separator";
import cn from "@anole/ui/utils/cn";
import { 
  Calendar, 
  Clock, 
  Edit, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Circle,
  AlertTriangle,
  Flag
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLiveQuery } from "@tanstack/react-db";

import { useTodos, useSelectedTodos, useTodoStats } from "../hooks/use-todos";
import { todoUIStateCollection, todoUIStateHelpers } from "../collections/ui-state-collection";
import { useTodoKeyboardShortcuts } from "../../keyboard/hooks/use-todo-keyboard-shortcuts";
import type { Todo } from "../collections/todo-collection";

interface TodoItemProps {
  todo: Todo;
  isSelected: boolean;
  onSelect: (todoId: string) => void;
  onToggleComplete: (todoId: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todoId: string) => void;
  className?: string;
}

const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  isSelected,
  onSelect,
  onToggleComplete,
  onEdit,
  onDelete,
  className,
}) => {
  const { setFocusedTodo } = useTodoKeyboardShortcuts();
  
  const getPriorityColor = (priority: Todo["priority"]) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-green-500";
      default: return "text-gray-500";
    }
  };

  const getPriorityIcon = (priority: Todo["priority"]) => {
    switch (priority) {
      case "high": return <AlertTriangle className="h-4 w-4" />;
      case "medium": return <Flag className="h-4 w-4" />;
      case "low": return <Circle className="h-4 w-4" />;
      default: return null;
    }
  };

  const isOverdue = todo.dueDate && todo.dueDate < new Date() && !todo.completed;
  const isDueToday = todo.dueDate && 
    todo.dueDate.toDateString() === new Date().toDateString() && 
    !todo.completed;

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-blue-500",
        todo.completed && "opacity-60",
        isOverdue && "border-red-300 bg-red-50/50",
        isDueToday && "border-orange-300 bg-orange-50/50",
        className
      )}
      data-todo-id={todo.id}
      tabIndex={0}
      onClick={() => onSelect(todo.id)}
      onFocus={() => setFocusedTodo(todo.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={todo.completed}
            onCheckedChange={() => onToggleComplete(todo.id)}
            className="mt-1"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 
                className={cn(
                  "font-medium text-sm",
                  todo.completed && "line-through text-gray-500"
                )}
              >
                {todo.title}
              </h3>
              
              {/* Priority indicator */}
              <div className={cn("flex items-center", getPriorityColor(todo.priority))}>
                {getPriorityIcon(todo.priority)}
              </div>
            </div>

            {/* Description */}
            {todo.description && (
              <p className={cn(
                "text-xs text-gray-600 mb-2 line-clamp-2",
                todo.completed && "line-through"
              )}>
                {todo.description}
              </p>
            )}

            {/* Meta information */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {/* Due date */}
              {todo.dueDate && (
                <div className={cn(
                  "flex items-center gap-1",
                  isOverdue && "text-red-600 font-medium",
                  isDueToday && "text-orange-600 font-medium"
                )}>
                  <Calendar className="h-3 w-3" />
                  <span>{todo.dueDate.toLocaleDateString()}</span>
                  {isOverdue && <span className="text-red-600">(Overdue)</span>}
                  {isDueToday && <span className="text-orange-600">(Due Today)</span>}
                </div>
              )}

              {/* Category */}
              {todo.category && (
                <Badge variant="secondary" className="text-xs">
                  {todo.category}
                </Badge>
              )}

              {/* Created date */}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{todo.createdAt.toLocaleDateString()}</span>
              </div>
            </div>

            {/* Tags */}
            {todo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {todo.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(todo);
              }}
              data-testid="edit-todo-button"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(todo.id);
              }}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface QuickAddProps {
  onAdd: (title: string) => void;
}

const QuickAdd: React.FC<QuickAddProps> = ({ onAdd }) => {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle("");
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a new todo... (Press Enter to save, Escape to cancel)"
            className="flex-1"
            data-testid="quick-add-input"
          />
          <Button type="submit" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

interface TodoListProps {
  className?: string;
}

const TodoList: React.FC<TodoListProps> = ({ className }) => {
  const { todos, createTodo, toggleTodoComplete, deleteTodo } = useTodos();
  const { selectedTodos, selectTodo } = useSelectedTodos();
  const { stats } = useTodoStats();
  
  // Get UI state
  const { data: uiState } = useLiveQuery((q) =>
    q.from({ state: todoUIStateCollection }).select(({ state }) => state)
  );
  
  const currentUIState = uiState?.[0] || todoUIStateHelpers.getCurrentState();
  
  // Initialize keyboard shortcuts
  useTodoKeyboardShortcuts();

  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const handleQuickAdd = async (title: string) => {
    await createTodo({ title });
    todoUIStateHelpers.toggleQuickAdd();
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    // This would open an edit modal or form
    console.log("Edit todo:", todo);
  };

  const handleDelete = async (todoId: string) => {
    if (confirm("Are you sure you want to delete this todo?")) {
      await deleteTodo(todoId);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Todo List</span>
            <div className="flex items-center gap-4 text-sm font-normal">
              {stats && (
                <>
                  <Badge variant="outline">{stats.total} Total</Badge>
                  <Badge variant="outline">{stats.active} Active</Badge>
                  <Badge variant="outline">{stats.completed} Completed</Badge>
                  {stats.overdue > 0 && (
                    <Badge variant="destructive">{stats.overdue} Overdue</Badge>
                  )}
                  {stats.dueToday > 0 && (
                    <Badge variant="secondary">{stats.dueToday} Due Today</Badge>
                  )}
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Quick add */}
      {currentUIState.quickAddVisible && (
        <QuickAdd onAdd={handleQuickAdd} />
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search todos..."
              value={currentUIState.search}
              onChange={(e) => todoUIStateHelpers.setSearch(e.target.value)}
              className="pl-9"
              data-testid="todo-search-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filter buttons */}
      <div className="flex gap-2">
        <Button
          variant={currentUIState.filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => todoUIStateHelpers.setFilter("all")}
        >
          All ({stats?.total || 0})
        </Button>
        <Button
          variant={currentUIState.filter === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => todoUIStateHelpers.setFilter("active")}
        >
          Active ({stats?.active || 0})
        </Button>
        <Button
          variant={currentUIState.filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => todoUIStateHelpers.setFilter("completed")}
        >
          Completed ({stats?.completed || 0})
        </Button>
      </div>

      {/* Selection info */}
      {selectedTodos.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedTodos.length} todo(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => todoUIStateHelpers.clearSelection()}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Todo list */}
      <div className="space-y-2">
        {todos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No todos found</p>
                <p className="text-sm">
                  {currentUIState.search || currentUIState.filter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first todo to get started"}
                </p>
                {!currentUIState.search && currentUIState.filter === "all" && (
                  <Button
                    className="mt-4"
                    onClick={() => todoUIStateHelpers.toggleQuickAdd()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Todo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              isSelected={selectedTodos.some(t => t.id === todo.id)}
              onSelect={selectTodo}
              onToggleComplete={toggleTodoComplete}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Keyboard shortcuts help */}
      <Card className="mt-8 border-dashed">
        <CardContent className="p-4">
          <div className="text-center text-sm text-gray-500">
            <p className="mb-2">Keyboard Shortcuts Available</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+Shift+N</kbd> New Todo</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Space</kbd> Toggle Complete</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Delete</kbd> Delete Todo</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+A</kbd> Select All</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">↑/↓</kbd> Navigate</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+F</kbd> Search</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+1/2/3</kbd> Filter</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+/</kbd> Help</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TodoList;