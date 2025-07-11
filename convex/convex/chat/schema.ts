import { defineTable } from "convex/server";
import { v } from "convex/values";

export const chatTables = {
    pinnedThreads: defineTable({
        pinnedAt: v.number(),
        threadId: v.string(),
        userId: v.id("user"),
    })
        .index("by_user", ["userId"])
        .index("by_thread", ["threadId"])
        .index("by_user_and_thread", ["userId", "threadId"]),

    threadOrder: defineTable({
        order: v.number(),
        threadId: v.string(),
        updatedAt: v.number(),
        userId: v.id("user"),
    })
        .index("by_user", ["userId"])
        .index("by_user_and_order", ["userId", "order"])
        .index("by_user_and_thread", ["userId", "threadId"]),

    // Thread relationships for branching and hierarchy
    threadRelationships: defineTable({
        branchPoint: v.optional(v.number()), // Which message index the branch started from (0-based)
        branchType: v.optional(v.union(v.literal("branch"), v.literal("continuation"))), // Type of relationship
        createdAt: v.number(), // When this relationship was created
        parentThreadId: v.string(), // The parent thread this was branched from
        threadId: v.string(), // The child thread
    })
        .index("by_thread", ["threadId"])
        .index("by_parent", ["parentThreadId"])
        .index("by_parent_and_thread", ["parentThreadId", "threadId"]),
};
