import { defineTable } from "convex/server";
import { v } from "convex/values";

export const authTables = {
    user: defineTable({
        customerId: v.optional(v.string()),
        email: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        role: v.union(v.literal("user"), v.literal("admin"), v.literal("banned")),
    }).index("by_email", ["email"]),

    userSettings: defineTable({
        codeFont: v.optional(v.union(v.literal("fira-code"), v.literal("mono"), v.literal("consolas"), v.literal("jetbrains"), v.literal("source-code-pro"))),
        disableExternalLinkWarning: v.optional(v.boolean()),
        hidePersonalInfo: v.optional(v.boolean()),
        isAdvancedUser: v.optional(v.boolean()),
        lastChatId: v.optional(v.string()),
        mainFont: v.optional(v.union(v.literal("inter"), v.literal("system"), v.literal("serif"), v.literal("mono"), v.literal("roboto-slab"))),
        notifications: v.optional(
            v.object({
                vouchReceived: v.optional(v.boolean()),
            }),
        ),
        selectedModel: v.optional(v.string()),
        sendBehavior: v.optional(v.union(v.literal("enter"), v.literal("shiftEnter"), v.literal("button"))),
        showTimestamps: v.optional(v.boolean()),
        userId: v.id("user"),
    }).index("by_userId", ["userId"]),

    vouches: defineTable({
        comment: v.optional(v.string()),
        fromUserId: v.id("user"),
        rating: v.number(), // 1-5
        toUserId: v.id("user"),
    })
        .index("by_toUserId", ["toUserId"])
        .index("by_fromUserId", ["fromUserId"])
        .index("by_toUserId_and_fromUserId", ["toUserId", "fromUserId"]),
};
