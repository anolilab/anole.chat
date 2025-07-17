import { defineTable } from "convex/server";
import { v } from "convex/values";

export const polarTables = {
    // Polar products table
    polarProducts: defineTable({
        id: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        price: v.number(),
        currency: v.string(),
        interval: v.string(), // "month" or "year"
        active: v.boolean(),
        metadata: v.optional(v.string()), // JSON string
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_product_id", ["id"])
        .index("by_active", ["active"]),

    // Polar subscriptions table (extends existing subscription schema)
    polarSubscriptions: defineTable({
        id: v.string(),
        customerId: v.string(),
        productId: v.string(),
        status: v.string(), // "active", "canceled", "past_due", etc.
        currentPeriodStart: v.number(),
        currentPeriodEnd: v.number(),
        cancelAtPeriodEnd: v.boolean(),
        canceledAt: v.optional(v.number()),
        endedAt: v.optional(v.number()),
        metadata: v.optional(v.string()), // JSON string
        createdAt: v.number(),
        updatedAt: v.number(),
        userId: v.id("users"),
    })
        .index("by_subscription_id", ["id"])
        .index("by_customer_id", ["customerId"])
        .index("by_user_id", ["userId"])
        .index("by_status", ["status"]),

    // Polar webhook events table
    polarWebhookEvents: defineTable({
        id: v.string(),
        type: v.string(), // "subscription.created", "subscription.updated", etc.
        data: v.string(), // JSON string of the webhook payload
        processed: v.boolean(),
        processedAt: v.optional(v.number()),
        createdAt: v.number(),
    })
        .index("by_event_id", ["id"])
        .index("by_type", ["type"])
        .index("by_processed", ["processed"]),

    // Polar customers table
    polarCustomers: defineTable({
        id: v.string(),
        email: v.string(),
        name: v.optional(v.string()),
        metadata: v.optional(v.string()), // JSON string
        createdAt: v.number(),
        updatedAt: v.number(),
        userId: v.id("users"),
    })
        .index("by_customer_id", ["id"])
        .index("by_email", ["email"])
        .index("by_user_id", ["userId"]),
};