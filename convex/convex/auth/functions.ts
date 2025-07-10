import { v } from "convex/values";
import { action, mutation, query, internalMutation, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { ROLES, type Role } from "../lib/types";
import { requireUserId } from "../auth/lib/helper";
import { customAction, customCtx, customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { betterAuthComponent } from "../auth";

const getCurrentUserInternal = async (ctx: QueryCtx) => {
    const userMetadata = await betterAuthComponent.getAuthUser(ctx);

    if (!userMetadata) {
        return null;
    }

    // Get user data from your application's database (skip this if you have no
    // fields in your users table schema)
    const user = await ctx.db.get(userMetadata.userId as Id<"user">);

    return {
        ...user,
        ...userMetadata,
    };
};

export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        return getCurrentUserInternal(ctx);
    },
});

export const authedQuery = customQuery(query, {
    args: {},
    input: async (ctx, args) => {
        const user = await getCurrentUserInternal(ctx);

        return {
            ctx: {
                user,
                ...ctx,
            },
            args,
        };
    },
});

export const authedMutation = customMutation(mutation, {
    args: {},
    input: async (ctx, args) => {
        const user = await getCurrentUserInternal(ctx);

        return {
            ctx: {
                user,
                ...ctx,
            },
            args,
        };
    },
});

export const authedAction = customAction(
    action,
    customCtx(async (ctx) => {
        const user = await getCurrentUserInternal(ctx);

        return {
            ...ctx,
            user,
        };
    }),
);

export const initializeNewUser = internalMutation({
    args: { userId: v.id("user"), email: v.optional(v.string()) }, // email is passed but not strictly used in this version
    returns: v.null(),
    handler: async (ctx, { userId }) => {
        // Removed unused email from destructuring
        const existingAppUser = await ctx.db.get(userId);

        if (existingAppUser?.role) {
            console.log(`User ${userId} already initialized with roles.`);
            return null;
        }

        await ctx.db.patch(userId, {
            role: ROLES.USER,
        });
        console.log(`Initialized user ${userId} with default role.`);
        return null;
    },
});

// --- Admin Functions ---
export const setUserRole = mutation({
    args: {
        userId: v.id("user"),
        role: v.union(v.literal(ROLES.USER), v.literal(ROLES.BANNED), v.literal(ROLES.ADMIN)),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { userId, role }): Promise<{ success: boolean }> => {
        const loggedInUserId = await requireUserId(ctx);

        const targetUser = await ctx.db.get(userId);

        if (!targetUser) {
            throw new Error("User not found.");
        }

        // TODO: Check if user is admin

        if (targetUser._id === loggedInUserId && role !== ROLES.ADMIN) {
            throw new Error("Admin cannot remove their own admin role.");
        }

        await ctx.db.patch(userId, { role: role as Role });

        return { success: true };
    },
});

export const toggleUserBanStatus = mutation({
    args: { userId: v.id("user"), ban: v.boolean() },
    returns: v.object({ success: v.boolean(), message: v.string() }),
    handler: async (ctx, { userId, ban }): Promise<{ success: boolean; message: string }> => {
        const loggedInUserId = await requireUserId(ctx);

        // TODO: Check if user is admin

        if (userId === loggedInUserId) {
            throw new Error("Admins cannot ban themselves.");
        }

        const user = await ctx.db.get(userId);

        if (!user) {
            throw new Error("User not found");
        }

        const newRole = ban ? ROLES.BANNED : ROLES.USER;
        await ctx.db.patch(userId, { role: newRole });

        return { success: true, message: `User ${userId} has been ${ban ? "banned" : "unbanned"}.` };
    },
});

export const updateUserSettings = authedMutation({
    args: {
        notifications: v.optional(
            v.object({
                vouchReceived: v.optional(v.boolean()),
            }),
        ),
        selectedModel: v.optional(v.string()),
        lastChatId: v.optional(v.string()),
        mainFont: v.optional(v.union(v.literal("inter"), v.literal("system"), v.literal("serif"), v.literal("mono"), v.literal("roboto-slab"))),
        codeFont: v.optional(v.union(v.literal("fira-code"), v.literal("mono"), v.literal("consolas"), v.literal("jetbrains"), v.literal("source-code-pro"))),
        sendBehavior: v.optional(v.union(v.literal("enter"), v.literal("shiftEnter"), v.literal("button"))),
        showTimestamps: v.optional(v.boolean()),
        isAdvancedUser: v.optional(v.boolean()),
        hidePersonalInfo: v.optional(v.boolean()),
        disableExternalLinkWarning: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const settings = await ctx.db
            .query("userSettings")
            .withIndex("by_userId", (q) => q.eq("userId", ctx.user.userId))
            .unique();

        const { ...rest } = args;

        if (settings) {
            await ctx.db.patch(settings._id, rest);
        } else {
            await ctx.db.insert("userSettings", {
                userId: ctx.user.userId,
                ...rest,
            });
        }
    },
});

export const getUserSettings = authedQuery({
    args: {},
    handler: async (ctx) => {
        const settings = await ctx.db
            .query("userSettings")
            .withIndex("by_userId", (q) => q.eq("userId", ctx.user.userId))
            .unique();

        return settings;
    },
});
