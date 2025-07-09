import { v } from "convex/values";
import { action, mutation, query, internalMutation, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { ROLES, type Role } from "../lib/types";
import { api } from "../_generated/api";
import { requireUserId } from "@convex/auth/lib/helper";
import { customAction, customCtx, customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { betterAuthComponent } from "@convex/auth";

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

export const publicUserProfileValidator = v.object({
    _id: v.id("user"),
    _creationTime: v.number(),
    name: v.union(v.string(), v.null()),
    robloxUsername: v.union(v.string(), v.null()),
    robloxAvatarUrl: v.union(v.string(), v.null()),
    role: v.string(),
    averageRating: v.union(v.number(), v.null()),
    vouchCount: v.number(),
});

export type PublicUserProfile = {
    _id: Id<"user">;
    _creationTime: number;
    name?: string | null;
    robloxUsername?: string | null;
    robloxAvatarUrl?: string | null;
    role: Role;
    averageRating: number | null;
    vouchCount: number;
};

type VouchStats = {
    averageRating: number | null;
    vouchCount: number;
};

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

export const getPublicUserProfile = query({
    args: { userId: v.id("user") },
    returns: v.union(publicUserProfileValidator, v.null()),
    handler: async (ctx, { userId }): Promise<PublicUserProfile | null> => {
        const user = await ctx.db.get(userId);

        if (!user) {
            return null;
        }

        const vouchStats: VouchStats = await ctx.runQuery(api.auth.functions.getUserVouchStats, { userId });

        return {
            _id: user._id,
            _creationTime: user._creationTime,
            name: user.name,
            robloxUsername: user.email,
            robloxAvatarUrl: user.image,
            role: user.role as Role,
            averageRating: vouchStats.averageRating,
            vouchCount: vouchStats.vouchCount,
        };
    },
});

export const updateMyProfile = mutation({
    args: {
        robloxUsername: v.optional(v.string()),
        robloxAvatarUrl: v.optional(v.string()),
        bio: v.optional(v.string()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, args): Promise<{ success: boolean }> => {
        const userId = await requireUserId(ctx);

        const updates: Partial<typeof args & { name?: string; email?: string }> = { ...args };

        await ctx.db.patch(userId, updates);

        return { success: true };
    },
});

export const updateSelectedModel = mutation({
    args: {
        model: v.string(),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { model }) => {
        const userId = await requireUserId(ctx);

        // Find userSettings by userId
        const userSettings = await ctx.db
            .query("userSettings")
            .withIndex("by_userId", (q) => q.eq("userId", userId as Id<"user">))
            .unique();

        if (userSettings) {
            await ctx.db.patch(userSettings._id, { selectedAgent: model });
        } else {
            await ctx.db.insert("userSettings", {
                userId: userId as Id<"user">,
                selectedAgent: model,
            });
        }

        return { success: true };
    },
});

export const getSelectedModel = query({
    args: {},
    returns: v.union(v.string(), v.null()),
    handler: async (ctx): Promise<string | null> => {
        const userId = await requireUserId(ctx);

        const userSettings: { selectedAgent?: string } | null = await ctx.db
            .query("userSettings")
            .withIndex("by_userId", (q) => q.eq("userId", userId as Id<"user">))
            .unique();
        return userSettings?.selectedAgent ?? null;
    },
});

export const updateLastChatId = mutation({
    args: {
        chatId: v.string(),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { chatId }) => {
        const userId = await requireUserId(ctx);

        const userSettings = await ctx.db
            .query("userSettings")
            .withIndex("by_userId", (q) => q.eq("userId", userId as Id<"user">))
            .unique();

        if (userSettings) {
            await ctx.db.patch(userSettings._id, { lastChatId: chatId });
        } else {
            await ctx.db.insert("userSettings", {
                userId: userId as Id<"user">,
                lastChatId: chatId,
            });
        }

        return { success: true };
    },
});

export const getLastChatId = query({
    args: {},
    returns: v.union(v.string(), v.null()),
    handler: async (ctx): Promise<string | null> => {
        const userId = await requireUserId(ctx);

        const userSettings: { lastChatId?: string } | null = await ctx.db
            .query("userSettings")
            .withIndex("by_userId", (q) => q.eq("userId", userId as Id<"user">))
            .unique();
        return userSettings?.lastChatId ?? null;
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
