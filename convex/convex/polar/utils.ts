import { query } from "../_generated/server";
import { v } from "convex/values";

// Helper function to check if a user has an active subscription
export const hasActiveSubscription = query({
    args: { userId: v.id("users") },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const subscription = await ctx.db
            .query("polarSubscriptions")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("status"), "active"))
            .unique();
        
        return subscription !== null;
    },
});

// Helper function to get subscription details with product info
export const getSubscriptionWithProduct = query({
    args: { userId: v.id("users") },
    returns: v.union(
        v.object({
            subscription: v.object({
                id: v.string(),
                customerId: v.string(),
                productId: v.string(),
                status: v.string(),
                currentPeriodStart: v.number(),
                currentPeriodEnd: v.number(),
                cancelAtPeriodEnd: v.boolean(),
                canceledAt: v.optional(v.number()),
                endedAt: v.optional(v.number()),
                metadata: v.optional(v.string()),
                createdAt: v.number(),
                updatedAt: v.number(),
                userId: v.id("users"),
            }),
            product: v.object({
                id: v.string(),
                name: v.string(),
                description: v.optional(v.string()),
                price: v.number(),
                currency: v.string(),
                interval: v.string(),
                active: v.boolean(),
                metadata: v.optional(v.string()),
                createdAt: v.number(),
                updatedAt: v.number(),
            }),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const subscription = await ctx.db
            .query("polarSubscriptions")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("status"), "active"))
            .unique();

        if (!subscription) {
            return null;
        }

        const product = await ctx.db
            .query("polarProducts")
            .withIndex("by_product_id", (q) => q.eq("id", subscription.productId))
            .unique();

        if (!product) {
            return null;
        }

        return {
            subscription,
            product,
        };
    },
});

// Helper function to check if subscription is expired
export const isSubscriptionExpired = query({
    args: { userId: v.id("users") },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const subscription = await ctx.db
            .query("polarSubscriptions")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("status"), "active"))
            .unique();

        if (!subscription) {
            return true; // No subscription means expired
        }

        return subscription.currentPeriodEnd < Date.now();
    },
});

// Helper function to get days until subscription expires
export const getDaysUntilExpiry = query({
    args: { userId: v.id("users") },
    returns: v.union(v.number(), v.null()),
    handler: async (ctx, args) => {
        const subscription = await ctx.db
            .query("polarSubscriptions")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("status"), "active"))
            .unique();

        if (!subscription) {
            return null;
        }

        const now = Date.now();
        const expiryTime = subscription.currentPeriodEnd;
        const daysUntilExpiry = Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));

        return daysUntilExpiry;
    },
});