import { defineTable } from "convex/server";
import { v } from "convex/values";
import { polar } from "@convex-dev/polar";

// Define the Polar tables
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

    // Polar subscriptions table
    polarSubscriptions: defineTable({
        id: v.string(),
        userId: v.id("users"),
        productId: v.string(),
        status: v.string(), // "active", "canceled", "past_due", etc.
        currentPeriodStart: v.number(),
        currentPeriodEnd: v.number(),
        cancelAtPeriodEnd: v.boolean(),
        metadata: v.optional(v.string()), // JSON string
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user_id", ["userId"])
        .index("by_subscription_id", ["id"])
        .index("by_status", ["status"]),

    // Polar customers table
    polarCustomers: defineTable({
        id: v.string(),
        userId: v.id("users"),
        email: v.string(),
        name: v.optional(v.string()),
        metadata: v.optional(v.string()), // JSON string
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user_id", ["userId"])
        .index("by_customer_id", ["id"]),

    // Polar webhook events table
    polarWebhookEvents: defineTable({
        id: v.string(),
        type: v.string(),
        data: v.string(), // JSON string
        processed: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_type", ["type"])
        .index("by_processed", ["processed"]),
};

// Initialize Polar with your configuration
export const polarConfig = polar({
    // Your Polar organization ID
    organizationId: process.env.POLAR_ORGANIZATION_ID!,
    
    // Your Polar access token
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    
    // Webhook secret for verifying webhook signatures
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
    
    // Optional: Custom webhook endpoint path (defaults to "/webhooks/polar")
    webhookPath: "/webhooks/polar",
    
    // Optional: Custom success URL for checkout redirects
    successUrl: process.env.POLAR_SUCCESS_URL || "https://yourdomain.com/success",
    
    // Optional: Custom cancel URL for checkout redirects
    cancelUrl: process.env.POLAR_CANCEL_URL || "https://yourdomain.com/cancel",
});

// Export the Polar functions
export const {
    // Queries
    getProducts,
    getProduct,
    getSubscriptions,
    getSubscription,
    getCustomer,
    getCustomerSubscriptions,
    
    // Mutations
    createCustomer,
    updateCustomer,
    createCheckoutSession,
    cancelSubscription,
    reactivateSubscription,
    
    // Actions
    syncProducts,
    syncSubscriptions,
    syncCustomers,
    
    // Webhook handler
    webhookHandler,
} = polarConfig;