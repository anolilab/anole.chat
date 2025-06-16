import { defineTable } from "convex/server";
import { v } from "convex/values";

export const chatTables = {
    // Thread relationships for branching and hierarchy
    threadRelationships: defineTable({
        threadId: v.string(), // The child thread
        parentThreadId: v.string(), // The parent thread this was branched from
        branchPoint: v.optional(v.number()), // Which message index the branch started from (0-based)
        branchType: v.optional(v.union(v.literal("branch"), v.literal("continuation"))), // Type of relationship
        createdAt: v.number(), // When this relationship was created
    })
        .index("by_thread", ["threadId"])
        .index("by_parent", ["parentThreadId"])
        .index("by_parent_and_thread", ["parentThreadId", "threadId"]),

    // Pinned threads for users
    pinnedThreads: defineTable({
        userId: v.id("user"),
        threadId: v.string(),
        pinnedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_thread", ["threadId"])
        .index("by_user_and_thread", ["userId", "threadId"]),

    // Thread ordering for users
    threadOrder: defineTable({
        userId: v.id("user"),
        threadId: v.string(),
        order: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_and_order", ["userId", "order"])
        .index("by_user_and_thread", ["userId", "threadId"]),
};
