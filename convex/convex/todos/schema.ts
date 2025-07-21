import { defineTable } from "convex/server";
import { v } from "convex/values";

export const todosTables = {
  todos: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    completed: v.boolean(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    category: v.optional(v.string()),
    dueDate: v.optional(v.string()), // ISO string
    tags: v.array(v.string()),
    order: v.number(),
    createdAt: v.string(), // ISO string
    updatedAt: v.string(), // ISO string
  })
    .index("by_user", ["userId"])
    .index("by_user_completed", ["userId", "completed"])
    .index("by_user_priority", ["userId", "priority"])
    .index("by_user_category", ["userId", "category"])
    .index("by_user_due_date", ["userId", "dueDate"])
    .index("by_user_order", ["userId", "order"])
    .searchIndex("search_content", {
      searchField: "title",
      filterFields: ["userId", "completed", "priority", "category"],
    }),
};

export default todosTables;