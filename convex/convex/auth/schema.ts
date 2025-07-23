import { defineTable } from "convex/server";
import { v } from "convex/values";

import { aiUserPreferencesFields, userSettingsFields, userFields } from "./fields";

const authTables = {
    aiUserPreferences: defineTable({
        userId: v.string(),
        ...aiUserPreferencesFields,
    }).index("by_userId", ["userId"]),

    users: defineTable({
        ...userFields,
    }).index("by_email", ["email"]),

    userSettings: defineTable({
        ...userSettingsFields,
        userId: v.string(),
    }).index("by_userId", ["userId"]),

    vouches: defineTable({
        comment: v.optional(v.string()),
        fromUserId: v.string(),
        rating: v.number(), // 1-5
        toUserId: v.string(),
    })
        .index("by_toUserId", ["toUserId"])
        .index("by_fromUserId", ["fromUserId"])
        .index("by_toUserId_and_fromUserId", ["toUserId", "fromUserId"]),
};

export default authTables;
