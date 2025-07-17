import { defineTable } from "convex/server";
import { v } from "convex/values";

import {
    aiUserPreferencesFields,
    extendedUserFields,
    userSettingsFields,
} from "./fields";

const authTables = {
    aiUserPreferences: defineTable({
        userId: v.id("users"),
        ...aiUserPreferencesFields,
    }).index("by_userId", ["userId"]),

    users: defineTable({
        ...extendedUserFields,
        userId: v.string(),
    })
        .index("by_email", ["email"])
        .index("by_userId", ["userId"]),

    userSettings: defineTable({
        ...userSettingsFields,
        userId: v.id("users"),
    }).index("by_userId", ["userId"]),

    // Credit usage tracking
    creditTransactions: defineTable({
        userId: v.id("users"),
        amount: v.number(), // Positive for credits added, negative for credits consumed
        balanceAfter: v.number(), // User's credit balance after this transaction
        balanceBefore: v.number(), // User's credit balance before this transaction
        description: v.string(), // Human-readable description of the transaction
        metadata: v.optional(v.any()), // Additional data (model used, thread ID, etc.)
        transactionType: v.union(
            v.literal("initial_allocation"), // Initial credits given to new user
            v.literal("message_consumption"), // Credits consumed for AI message
            v.literal("manual_adjustment"), // Manual credit adjustment by admin
            v.literal("subscription_credit"), // Credits from subscription
            v.literal("purchase_credit"), // Credits from one-time purchase
            v.literal("refund"), // Credit refund
            v.literal("expiration"), // Credits expired
        ),
    })
        .index("by_userId", ["userId"])
        .index("by_userId_and_type", ["userId", "transactionType"])
        .index("by_userId_and_date", ["userId", "_creationTime"]),

    // Daily usage aggregation for analytics
    dailyUsageStats: defineTable({
        userId: v.id("users"),
        date: v.string(), // YYYY-MM-DD format
        creditsConsumed: v.number(),
        creditsAdded: v.number(),
        messageCount: v.number(),
        modelUsage: v.optional(v.record(v.string(), v.number())), // Model -> usage count
        totalCost: v.optional(v.number()), // Estimated cost in USD
    })
        .index("by_userId", ["userId"])
        .index("by_userId_and_date", ["userId", "date"])
        .index("by_date", ["date"]),

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
