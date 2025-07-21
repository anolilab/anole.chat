import { createFileRoute } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";

import TodoList from "../../features/todos/components/todo-list";

export const Route = createFileRoute("/todos/")({
  component: TodosPage,
});

function TodosPage() {
  return (
    <>
      <Helmet>
        <title>Todo List - Anole</title>
        <meta name="description" content="Manage your todos with TanStack DB" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Todo List
          </h1>
          <p className="text-gray-600">
            Manage your tasks with real-time sync, keyboard shortcuts, and smart filtering.
            Powered by TanStack DB.
          </p>
        </div>
        
        <TodoList />
      </div>
    </>
  );
}