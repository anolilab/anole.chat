import { internal } from "@cvx/_generated/api";
import { mutation, query } from "@cvx/_generated/server";
import { currencyValidator, PLANS } from "@cvx/schema";
import { asyncMap } from "convex-helpers";
import { v } from "convex/values";
import { User } from "@cvx/types";
import { Id } from "./_generated/dataModel";

export const getCurrentUser = query({
    args: {},
    handler: async (ctx): Promise<User | undefined> => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return;
        }

        const [user, subscription] = await Promise.all([
            ctx.db.get(identity.tokenIdentifier as Id<"users">),
            ctx.db
                .query("subscriptions")
                .withIndex("userId", (q) => q.eq("userId", identity.tokenIdentifier as Id<"users">))
                .unique(),
        ]);
        if (!user) {
            return;
        }
        const plan = subscription?.planId ? await ctx.db.get(subscription.planId) : undefined;
        const avatarUrl = user.imageId ? await ctx.storage.getUrl(user.imageId) : user.image;
        return {
            ...user,
            avatarUrl: avatarUrl || undefined,
            subscription:
                subscription && plan
                    ? {
                          ...subscription,
                          planKey: plan.key,
                      }
                    : undefined,
        };
    },
});

export const updateUsername = mutation({
    args: {
        username: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return;
        }

        await ctx.db.patch(identity.tokenIdentifier as Id<"users">, { username: args.username });
    },
});

export const completeOnboarding = mutation({
    args: {
        username: v.string(),
        currency: currencyValidator,
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return;
        }

        const user = await ctx.db.get(identity.tokenIdentifier as Id<"users">);

        if (!user) {
            return;
        }

        await ctx.db.patch(identity.tokenIdentifier as Id<"users">, { username: args.username });

        if (user.customerId) {
            return;
        }

        await ctx.scheduler.runAfter(0, internal.stripe.PREAUTH_createStripeCustomer, {
            currency: args.currency,
            userId: identity.tokenIdentifier as Id<"users">,
        });
    },
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("User not found");
        }

        return await ctx.storage.generateUploadUrl();
    },
});

export const updateUserImage = mutation({
    args: {
        imageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return;
        }

        ctx.db.patch(identity.tokenIdentifier as Id<"users">, { imageId: args.imageId });
    },
});

export const removeUserImage = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return;
        }

        ctx.db.patch(identity.tokenIdentifier as Id<"users">, { imageId: undefined, image: undefined });
    },
});

export const getActivePlans = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return;
        }

        const [free, pro] = await asyncMap([PLANS.FREE, PLANS.PRO] as const, (key) =>
            ctx.db
                .query("plans")
                .withIndex("key", (q) => q.eq("key", key))
                .unique(),
        );

        if (!free || !pro) {
            throw new Error("Plan not found");
        }

        return { free, pro };
    },
});

export const deleteCurrentUserAccount = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return;
        }

        const user = await ctx.db.get(identity.tokenIdentifier as Id<"users">);

        if (!user) {
            throw new Error("User not found");
        }

        const subscription = await ctx.db
            .query("subscriptions")
            .withIndex("userId", (q) => q.eq("userId", identity.tokenIdentifier as Id<"users">))
            .unique();
        if (!subscription) {
            console.error("No subscription found");
        } else {
            await ctx.db.delete(subscription._id);
            await ctx.scheduler.runAfter(0, internal.stripe.cancelCurrentUserSubscriptions);
        }

        await ctx.db.delete(identity.tokenIdentifier as Id<"users">);

        await asyncMap(["resend-otp", "github"], async (provider) => {
            const authAccount = await ctx.db
                // @ts-ignore - check the types
                .query("authAccounts")
                // @ts-ignore - check the types
                .withIndex("userIdAndProvider", (q) =>
                    // @ts-ignore - check the types
                    q.eq("userId", userId).eq("provider", provider),
                )
                .unique();

            if (!authAccount) {
                return;
            }

            await ctx.db.delete(authAccount._id);
        });
    },
});
