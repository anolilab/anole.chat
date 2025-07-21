import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Get all todos for a user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const todos = await ctx.db
      .query("todos")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .order("desc")
      .collect();

    return todos.map(todo => ({
      ...todo,
      createdAt: new Date(todo.createdAt),
      updatedAt: new Date(todo.updatedAt),
      dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
    }));
  },
});

// Create a new todo
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    category: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = new Date().toISOString();

    // Get the highest order number for proper ordering
    const existingTodos = await ctx.db
      .query("todos")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .collect();

    const maxOrder = Math.max(...existingTodos.map(t => t.order), -1);

    const todoId = await ctx.db.insert("todos", {
      userId: identity.subject,
      title: args.title,
      description: args.description,
      completed: false,
      priority: args.priority,
      category: args.category,
      dueDate: args.dueDate,
      tags: args.tags || [],
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });

    return todoId;
  },
});

// Update an existing todo
export const update = mutation({
  args: {
    id: v.id("todos"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    category: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify ownership
    const todo = await ctx.db.get(args.id);
    if (!todo || todo.userId !== identity.subject) {
      throw new Error("Todo not found or not authorized");
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    // Only update provided fields
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.completed !== undefined) updates.completed = args.completed;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.category !== undefined) updates.category = args.category;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.order !== undefined) updates.order = args.order;

    await ctx.db.patch(args.id, updates);
    
    return args.id;
  },
});

// Delete a todo
export const remove = mutation({
  args: {
    id: v.id("todos"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify ownership
    const todo = await ctx.db.get(args.id);
    if (!todo || todo.userId !== identity.subject) {
      throw new Error("Todo not found or not authorized");
    }

    await ctx.db.delete(args.id);
    
    return args.id;
  },
});

// Bulk update todos (for reordering, bulk operations)
export const bulkUpdate = mutation({
  args: {
    updates: v.array(v.object({
      id: v.id("todos"),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      completed: v.optional(v.boolean()),
      priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
      category: v.optional(v.string()),
      dueDate: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      order: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = new Date().toISOString();
    const results = [];

    for (const update of args.updates) {
      // Verify ownership
      const todo = await ctx.db.get(update.id);
      if (!todo || todo.userId !== identity.subject) {
        continue; // Skip unauthorized todos
      }

      const updates: any = {
        updatedAt: now,
      };

      // Only update provided fields
      if (update.title !== undefined) updates.title = update.title;
      if (update.description !== undefined) updates.description = update.description;
      if (update.completed !== undefined) updates.completed = update.completed;
      if (update.priority !== undefined) updates.priority = update.priority;
      if (update.category !== undefined) updates.category = update.category;
      if (update.dueDate !== undefined) updates.dueDate = update.dueDate;
      if (update.tags !== undefined) updates.tags = update.tags;
      if (update.order !== undefined) updates.order = update.order;

      await ctx.db.patch(update.id, updates);
      results.push(update.id);
    }

    return results;
  },
});

// Get todo statistics
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const todos = await ctx.db
      .query("todos")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .collect();

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = {
      total: todos.length,
      completed: todos.filter(t => t.completed).length,
      active: todos.filter(t => !t.completed).length,
      highPriority: todos.filter(t => t.priority === "high" && !t.completed).length,
      overdue: todos.filter(t => {
        if (!t.dueDate || t.completed) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate < now;
      }).length,
      dueToday: todos.filter(t => {
        if (!t.dueDate || t.completed) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate < tomorrow;
      }).length,
      categories: [...new Set(todos.map(t => t.category).filter(Boolean))].length,
    };

    return stats;
  },
});

// Search todos
export const search = query({
  args: {
    query: v.string(),
    filter: v.optional(v.union(v.literal("all"), v.literal("active"), v.literal("completed"))),
    category: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    let todos = await ctx.db
      .query("todos")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .collect();

    // Apply text search
    if (args.query.trim()) {
      const queryLower = args.query.toLowerCase();
      todos = todos.filter(todo => 
        todo.title.toLowerCase().includes(queryLower) ||
        (todo.description && todo.description.toLowerCase().includes(queryLower)) ||
        (todo.category && todo.category.toLowerCase().includes(queryLower)) ||
        todo.tags.some(tag => tag.toLowerCase().includes(queryLower))
      );
    }

    // Apply completion filter
    if (args.filter === "active") {
      todos = todos.filter(t => !t.completed);
    } else if (args.filter === "completed") {
      todos = todos.filter(t => t.completed);
    }

    // Apply category filter
    if (args.category) {
      todos = todos.filter(t => t.category === args.category);
    }

    // Apply priority filter
    if (args.priority) {
      todos = todos.filter(t => t.priority === args.priority);
    }

    return todos.map(todo => ({
      ...todo,
      createdAt: new Date(todo.createdAt),
      updatedAt: new Date(todo.updatedAt),
      dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
    }));
  },
});