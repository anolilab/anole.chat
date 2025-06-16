import { defineTable } from "convex/server";
import { v } from "convex/values";

export const userTables = {
    vouches: defineTable({
        fromUserId: v.id("user"),
        toUserId: v.id("user"),
        rating: v.number(), // 1-5
        comment: v.optional(v.string()),
    })
        .index("by_toUserId", ["toUserId"])
        .index("by_fromUserId", ["fromUserId"])
        .index("by_toUserId_and_fromUserId", ["toUserId", "fromUserId"]),

    userSettings: defineTable({
        userId: v.id("user"),
        notifications: v.optional(
            v.object({
                vouchReceived: v.optional(v.boolean()),
            }),
        ),
        selectedAgent: v.optional(v.string()),
    }).index("by_userId", ["userId"]),
};
