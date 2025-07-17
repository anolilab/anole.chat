import { query, mutation, action, internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Polar } from "@polar-sh/sdk";
import { internal } from "../_generated/api";

// Initialize Polar SDK
const polar = new Polar({
    token: process.env.POLAR_ACCESS_TOKEN!,
});

// Public queries
export const getProducts = query({
    args: {},
    returns: v.array(v.object({
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
    })),
    handler: async (ctx) => {
        const products = await ctx.db
            .query("polarProducts")
            .withIndex("by_active", (q) => q.eq("active", true))
            .collect();
        
        return products;
    },
});

export const getProduct = query({
    args: { productId: v.string() },
    returns: v.union(
        v.object({
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
        v.null()
    ),
    handler: async (ctx, args) => {
        const product = await ctx.db
            .query("polarProducts")
            .withIndex("by_product_id", (q) => q.eq("id", args.productId))
            .unique();
        
        return product;
    },
});

export const getUserSubscription = query({
    args: { userId: v.id("users") },
    returns: v.union(
        v.object({
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
        v.null()
    ),
    handler: async (ctx, args) => {
        const subscription = await ctx.db
            .query("polarSubscriptions")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("status"), "active"))
            .unique();
        
        return subscription;
    },
});

// Public mutations
export const createCustomer = mutation({
    args: {
        userId: v.id("users"),
        email: v.string(),
        name: v.optional(v.string()),
    },
    returns: v.object({ customerId: v.string() }),
    handler: async (ctx, args) => {
        // Create customer in Polar
        const customer = await polar.customers.create({
            email: args.email,
            name: args.name,
        });

        // Store customer in database
        await ctx.db.insert("polarCustomers", {
            id: customer.id,
            email: args.email,
            name: args.name,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            userId: args.userId,
        });

        return { customerId: customer.id };
    },
});

export const createCheckoutSession = mutation({
    args: {
        userId: v.id("users"),
        productId: v.string(),
        successUrl: v.string(),
        cancelUrl: v.string(),
    },
    returns: v.object({ url: v.string() }),
    handler: async (ctx, args) => {
        // Get or create customer
        let customer = await ctx.db
            .query("polarCustomers")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .unique();

        if (!customer) {
            // Get user details
            const user = await ctx.db.get(args.userId);
            if (!user) {
                throw new Error("User not found");
            }

            // Create customer in Polar
            const polarCustomer = await polar.customers.create({
                email: user.email || "user@example.com",
                name: user.name,
            });

            // Store customer in database
            await ctx.db.insert("polarCustomers", {
                id: polarCustomer.id,
                email: user.email || "user@example.com",
                name: user.name,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                userId: args.userId,
            });

            customer = {
                id: polarCustomer.id,
                email: user.email || "user@example.com",
                name: user.name,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                userId: args.userId,
            };
        }

        // Create checkout session
        const session = await polar.checkout.create({
            customer_id: customer.id,
            product_id: args.productId,
            success_url: args.successUrl,
            cancel_url: args.cancelUrl,
        });

        return { url: session.url };
    },
});

// Internal functions for webhook processing
export const processWebhook = internalMutation({
    args: {
        eventId: v.string(),
        eventType: v.string(),
        eventData: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        // Store webhook event
        await ctx.db.insert("polarWebhookEvents", {
            id: args.eventId,
            type: args.eventType,
            data: args.eventData,
            processed: false,
            createdAt: Date.now(),
        });

        // Process based on event type
        const data = JSON.parse(args.eventData);
        
        switch (args.eventType) {
            case "subscription.created":
                await ctx.scheduler.runAfter(0, internal.polar.handleSubscriptionCreated, {
                    subscriptionData: args.eventData,
                });
                break;
            case "subscription.updated":
                await ctx.scheduler.runAfter(0, internal.polar.handleSubscriptionUpdated, {
                    subscriptionData: args.eventData,
                });
                break;
            case "subscription.canceled":
                await ctx.scheduler.runAfter(0, internal.polar.handleSubscriptionCanceled, {
                    subscriptionData: args.eventData,
                });
                break;
        }

        return null;
    },
});

// Internal actions for webhook processing
export const handleSubscriptionCreated = internalAction({
    args: { subscriptionData: v.string() },
    returns: v.null(),
    handler: async (ctx, args) => {
        const data = JSON.parse(args.subscriptionData);
        const subscription = data.data;

        // Find customer by Polar customer ID
        const customer = await ctx.runQuery(internal.polar.getCustomerByPolarId, {
            customerId: subscription.customer_id,
        });

        if (!customer) {
            console.error("Customer not found for subscription:", subscription.id);
            return null;
        }

        // Create subscription record
        await ctx.runMutation(internal.polar.createSubscriptionRecord, {
            subscriptionId: subscription.id,
            customerId: subscription.customer_id,
            productId: subscription.product_id,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start).getTime(),
            currentPeriodEnd: new Date(subscription.current_period_end).getTime(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            metadata: JSON.stringify(subscription),
            createdAt: new Date(subscription.created_at).getTime(),
            updatedAt: new Date(subscription.updated_at).getTime(),
            userId: customer.userId,
        });

        return null;
    },
});

export const handleSubscriptionUpdated = internalAction({
    args: { subscriptionData: v.string() },
    returns: v.null(),
    handler: async (ctx, args) => {
        const data = JSON.parse(args.subscriptionData);
        const subscription = data.data;

        // Update subscription record
        await ctx.runMutation(internal.polar.updateSubscriptionRecord, {
            subscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start).getTime(),
            currentPeriodEnd: new Date(subscription.current_period_end).getTime(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at).getTime() : undefined,
            metadata: JSON.stringify(subscription),
            updatedAt: new Date(subscription.updated_at).getTime(),
        });

        return null;
    },
});

export const handleSubscriptionCanceled = internalAction({
    args: { subscriptionData: v.string() },
    returns: v.null(),
    handler: async (ctx, args) => {
        const data = JSON.parse(args.subscriptionData);
        const subscription = data.data;

        // Update subscription record
        await ctx.runMutation(internal.polar.updateSubscriptionRecord, {
            subscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start).getTime(),
            currentPeriodEnd: new Date(subscription.current_period_end).getTime(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at).getTime() : undefined,
            endedAt: subscription.ended_at ? new Date(subscription.ended_at).getTime() : undefined,
            metadata: JSON.stringify(subscription),
            updatedAt: new Date(subscription.updated_at).getTime(),
        });

        return null;
    },
});

// Internal queries and mutations for webhook processing
export const getCustomerByPolarId = internalQuery({
    args: { customerId: v.string() },
    returns: v.union(
        v.object({
            id: v.string(),
            email: v.string(),
            name: v.optional(v.string()),
            metadata: v.optional(v.string()),
            createdAt: v.number(),
            updatedAt: v.number(),
            userId: v.id("users"),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const customer = await ctx.db
            .query("polarCustomers")
            .withIndex("by_customer_id", (q) => q.eq("id", args.customerId))
            .unique();
        
        return customer;
    },
});

export const createSubscriptionRecord = internalMutation({
    args: {
        subscriptionId: v.string(),
        customerId: v.string(),
        productId: v.string(),
        status: v.string(),
        currentPeriodStart: v.number(),
        currentPeriodEnd: v.number(),
        cancelAtPeriodEnd: v.boolean(),
        metadata: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
        userId: v.id("users"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await ctx.db.insert("polarSubscriptions", {
            id: args.subscriptionId,
            customerId: args.customerId,
            productId: args.productId,
            status: args.status,
            currentPeriodStart: args.currentPeriodStart,
            currentPeriodEnd: args.currentPeriodEnd,
            cancelAtPeriodEnd: args.cancelAtPeriodEnd,
            metadata: args.metadata,
            createdAt: args.createdAt,
            updatedAt: args.updatedAt,
            userId: args.userId,
        });

        return null;
    },
});

export const updateSubscriptionRecord = internalMutation({
    args: {
        subscriptionId: v.string(),
        status: v.string(),
        currentPeriodStart: v.number(),
        currentPeriodEnd: v.number(),
        cancelAtPeriodEnd: v.boolean(),
        canceledAt: v.optional(v.number()),
        endedAt: v.optional(v.number()),
        metadata: v.optional(v.string()),
        updatedAt: v.number(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const subscription = await ctx.db
            .query("polarSubscriptions")
            .withIndex("by_subscription_id", (q) => q.eq("id", args.subscriptionId))
            .unique();

        if (!subscription) {
            throw new Error("Subscription not found");
        }

        await ctx.db.patch(subscription._id, {
            status: args.status,
            currentPeriodStart: args.currentPeriodStart,
            currentPeriodEnd: args.currentPeriodEnd,
            cancelAtPeriodEnd: args.cancelAtPeriodEnd,
            canceledAt: args.canceledAt,
            endedAt: args.endedAt,
            metadata: args.metadata,
            updatedAt: args.updatedAt,
        });

        return null;
    },
});