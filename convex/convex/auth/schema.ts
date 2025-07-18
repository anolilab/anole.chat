import { defineTable } from "convex/server";
import { v } from "convex/values";

import { aiUserPreferencesFields, userSettingsFields } from "./fields";

const authTables = {
    aiUserPreferences: defineTable({
        userId: v.id("user"),
        ...aiUserPreferencesFields,
    }).index("by_userId", ["userId"]),

    userSettings: defineTable({
        ...userSettingsFields,
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

export default authTables;
