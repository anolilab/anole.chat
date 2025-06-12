import { ConvexError, v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ROLES, type Role } from "./types";
import { api, internal } from "./_generated/api";

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

        const vouchStats: VouchStats = await ctx.runQuery(api.vouches.getUserVouchStats, { userId });

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
        sessionToken: v.string(),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, args): Promise<{ success: boolean }> => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        const updates: Partial<typeof args & { name?: string; email?: string }> = { ...args };

        await ctx.db.patch(sessionData.userId, updates);

        return { success: true };
    },
});

// --- Admin Functions ---
export const setUserRole = mutation({
    args: {
        userId: v.id("user"),
        role: v.union(v.literal(ROLES.USER), v.literal(ROLES.BANNED), v.literal(ROLES.ADMIN)),
        sessionToken: v.string(),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { userId, role, sessionToken }): Promise<{ success: boolean }> => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        const targetUser = await ctx.db.get(userId);

        if (!targetUser) {
            throw new Error("User not found.");
        }

        // TODO: Check if user is admin

        if (targetUser._id === sessionData.userId && role !== ROLES.ADMIN) {
            throw new Error("Admin cannot remove their own admin role.");
        }

        await ctx.db.patch(userId, { role: role as Role });

        return { success: true };
    },
});

export const toggleUserBanStatus = mutation({
    args: { userId: v.id("user"), ban: v.boolean(), sessionToken: v.string() },
    returns: v.object({ success: v.boolean(), message: v.string() }),
    handler: async (ctx, { userId, ban, sessionToken }): Promise<{ success: boolean; message: string }> => {
        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        // TODO: Check if user is admin

        if (userId === sessionData.userId) {
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
