import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { z } from "zod";
import { api } from "@anole/convex/convex/_generated/api";

// Todo schema for type safety and validation
export const todoSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z.string().optional(),
  dueDate: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  tags: z.array(z.string()).default([]),
  order: z.number().default(0),
});

export type Todo = z.infer<typeof todoSchema>;

// Create the todo collection with ConvexDB integration
export const todoCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["todos"],
    queryFn: async ({ queryClient }) => {
      // Use Convex query to fetch todos
      const convexClient = queryClient.getQueryData(["convex-client"]) as any;
      return await convexClient.query(api.todos.functions.list);
    },
    getKey: (item: Todo) => item.id,
    schema: todoSchema,
    onInsert: async ({ transaction }) => {
      const { modified: newTodo } = transaction.mutations[0];
      const convexClient = transaction.mutations[0].collection.convexClient;
      
      // Insert into ConvexDB
      await convexClient.mutation(api.todos.functions.create, {
        title: newTodo.title,
        description: newTodo.description,
        priority: newTodo.priority,
        category: newTodo.category,
        dueDate: newTodo.dueDate?.toISOString(),
        tags: newTodo.tags,
      });
      
      // Refetch to get server state
      await transaction.mutations[0].collection.refetch();
    },
    onUpdate: async ({ transaction }) => {
      const { original, modified } = transaction.mutations[0];
      const convexClient = transaction.mutations[0].collection.convexClient;
      
      // Update in ConvexDB
      await convexClient.mutation(api.todos.functions.update, {
        id: original.id,
        title: modified.title,
        description: modified.description,
        completed: modified.completed,
        priority: modified.priority,
        category: modified.category,
        dueDate: modified.dueDate?.toISOString(),
        tags: modified.tags,
        order: modified.order,
      });
      
      // Refetch to get server state
      await transaction.mutations[0].collection.refetch();
    },
    onDelete: async ({ transaction }) => {
      const { original } = transaction.mutations[0];
      const convexClient = transaction.mutations[0].collection.convexClient;
      
      // Delete from ConvexDB
      await convexClient.mutation(api.todos.functions.remove, { id: original.id });
      
      // Refetch to get server state
      await transaction.mutations[0].collection.refetch();
    },
  })
);