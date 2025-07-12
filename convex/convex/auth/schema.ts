import { defineTable } from "convex/server";
import { v } from "convex/values";
import { userSettingsFields, aiUserPreferencesFields, extendedUserFields } from "./fields";

const authTables = {
    users: defineTable({
        ...extendedUserFields,
        userId: v.string(),
    }).index("by_email", ["email"])
    .index("by_userId", ["userId"]),

    userSettings: defineTable({
        ...userSettingsFields,
        userId: v.id("users"),
    }).index("by_userId", ["userId"]),

    aiUserPreferences: defineTable({
        userId: v.id("users"),
        ...aiUserPreferencesFields,
    }).index("by_userId", ["userId"]),

    vouches: defineTable({
        comment: v.optional(v.string()),
        fromUserId: v.id("users"),
        rating: v.number(), // 1-5
        toUserId: v.id("users"),
    })
        .index("by_toUserId", ["toUserId"])
        .index("by_fromUserId", ["fromUserId"])
        .index("by_toUserId_and_fromUserId", ["toUserId", "fromUserId"]),
};

export default authTables;
