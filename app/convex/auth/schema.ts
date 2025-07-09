import { defineTable } from "convex/server";
import { v } from "convex/values";

export const authTables = {
    user: defineTable({
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        email: v.string(),
        customerId: v.optional(v.string()),
        role: v.union(v.literal("user"), v.literal("admin"), v.literal("banned")),
    }).index("by_email", ["email"]),

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
        selectedModel: v.optional(v.string()),
        lastChatId: v.optional(v.string()),
        mainFont: v.optional(v.union(v.literal("inter"), v.literal("system"), v.literal("serif"), v.literal("mono"), v.literal("roboto-slab"))),
        codeFont: v.optional(v.union(v.literal("fira-code"), v.literal("mono"), v.literal("consolas"), v.literal("jetbrains"), v.literal("source-code-pro"))),
        sendBehavior: v.optional(v.union(v.literal("enter"), v.literal("shiftEnter"), v.literal("button"))),
        showTimestamps: v.optional(v.boolean()),
        isAdvancedUser: v.optional(v.boolean()),
    }).index("by_userId", ["userId"]),
};
