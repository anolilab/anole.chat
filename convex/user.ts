import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import type { Id, Doc } from "./_generated/dataModel";
import { ROLES, type Role } from "./types";
import { api } from "./_generated/api";
import { getUser, requireAdmin } from "./utils/auth";

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
    handler: async (ctx, { userId }) => {
        // Removed unused email from destructuring
        const existingAppUser = await ctx.db.get(userId);

        if (existingAppUser?.role) {
            console.log(`User ${userId} already initialized with roles.`);
            return;
        }

        await ctx.db.patch(userId, {
            role: ROLES.USER,
        });
        console.log(`Initialized user ${userId} with default role.`);
    },
});

export const getCurrentUser = query({
    handler: async (ctx): Promise<Doc<"user"> | null> => {
        const user = await getUser(ctx);
        if (!user) return null;
        return user;
    },
});

export const getPublicUserProfile = query({
    args: { userId: v.id("user") },
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
    },
    handler: async (ctx, args): Promise<{ success: boolean }> => {
        const user = await getUser(ctx);
        if (!user) {
            throw new Error("You must be logged in to update your profile.");
        }

        const updates: Partial<typeof args & { name?: string; email?: string }> = { ...args };
        await ctx.db.patch(user._id, updates);
        return { success: true };
    },
});

// --- Admin Functions ---
export const setUserRole = mutation({
    args: {
        userId: v.id("user"),
        role: v.union(v.literal(ROLES.USER), v.literal(ROLES.BANNED), v.literal(ROLES.ADMIN)),
    },
    handler: async (ctx, { userId, role }): Promise<{ success: boolean }> => {
        const adminUser = await requireAdmin(ctx);
        const targetUser = await ctx.db.get(userId);
        if (!targetUser) {
            throw new Error("User not found.");
        }
        if (targetUser._id === adminUser._id && role !== ROLES.ADMIN) {
            throw new Error("Admin cannot remove their own admin role.");
        }

        await ctx.db.patch(userId, { role: role as Role });

        return { success: true };
    },
});

export const toggleUserBanStatus = mutation({
    args: { userId: v.id("user"), ban: v.boolean() },
    handler: async (ctx, { userId, ban }): Promise<{ success: boolean; message: string }> => {
        const admin = await requireAdmin(ctx);
        if (userId === admin._id) {
            throw new Error("Admins cannot ban themselves.");
        }
        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        console.log(`Admin ${admin._id} ${ban ? "banned" : "unbanned"} user ${userId}. (Conceptual: isBanned field not in schema)`);

        return { success: true, message: `User ${userId} ban status update logged (conceptual).` };
    },
});
