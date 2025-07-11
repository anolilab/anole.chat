import { v } from "convex/values";
import { customAction, customCtx, customMutation, customQuery } from "convex-helpers/server/customFunctions";

import type { Id } from "../_generated/dataModel";
import type { QueryCtx as QueryContext } from "../_generated/server";
import { action, internalMutation, mutation, query } from "../_generated/server";
import { betterAuthComponent } from "../auth";
import { requireUserId } from "../auth/lib/helper";
import type { Role } from "../lib/types";
import { ROLES } from "../lib/types";

const getCurrentUserInternal = async (context: QueryContext) => {
    const userMetadata = await betterAuthComponent.getAuthUser(context);

    if (!userMetadata) {
        return null;
    }

    // Get user data from your application's database (skip this if you have no
    // fields in your users table schema)
    const user = await context.db.get(userMetadata.userId as Id<"user">);

    return {
        ...user,
        ...userMetadata,
    };
};

export const getCurrentUser = query({
    args: {},
    handler: async (context) => getCurrentUserInternal(context),
});

export const authedQuery = customQuery(query, {
    args: {},
    input: async (context, arguments_) => {
        const user = await getCurrentUserInternal(context);

        return {
            args: arguments_,
            ctx: {
                user,
                ...context,
            },
        };
    },
});

export const authedMutation = customMutation(mutation, {
    args: {},
    input: async (context, arguments_) => {
        const user = await getCurrentUserInternal(context);

        return {
            args: arguments_,
            ctx: {
                user,
                ...context,
            },
        };
    },
});

export const authedAction = customAction(
    action,
    customCtx(async (context) => {
        const user = await getCurrentUserInternal(context);

        return {
            ...context,
            user,
        };
    }),
);

export const initializeNewUser = internalMutation({
    args: { email: v.optional(v.string()), userId: v.id("user") }, // email is passed but not strictly used in this version
    handler: async (context, { userId }) => {
        // Removed unused email from destructuring
        const existingAppUser = await context.db.get(userId);

        if (existingAppUser?.role) {
            console.log(`User ${userId} already initialized with roles.`);

            return null;
        }

        await context.db.patch(userId, {
            role: ROLES.USER,
        });
        console.log(`Initialized user ${userId} with default role.`);

        return null;
    },
    returns: v.null(),
});

// --- Admin Functions ---
export const setUserRole = mutation({
    args: {
        role: v.union(v.literal(ROLES.USER), v.literal(ROLES.BANNED), v.literal(ROLES.ADMIN)),
        userId: v.id("user"),
    },
    handler: async (context, { role, userId }): Promise<{ success: boolean }> => {
        const loggedInUserId = await requireUserId(context);

        const targetUser = await context.db.get(userId);

        if (!targetUser) {
            throw new Error("User not found.");
        }

        // TODO: Check if user is admin

        if (targetUser._id === loggedInUserId && role !== ROLES.ADMIN) {
            throw new Error("Admin cannot remove their own admin role.");
        }

        await context.db.patch(userId, { role: role as Role });

        return { success: true };
    },
    returns: v.object({ success: v.boolean() }),
});

export const toggleUserBanStatus = mutation({
    args: { ban: v.boolean(), userId: v.id("user") },
    handler: async (context, { ban, userId }): Promise<{ message: string; success: boolean }> => {
        const loggedInUserId = await requireUserId(context);

        // TODO: Check if user is admin

        if (userId === loggedInUserId) {
            throw new Error("Admins cannot ban themselves.");
        }

        const user = await context.db.get(userId);

        if (!user) {
            throw new Error("User not found");
        }

        const newRole = ban ? ROLES.BANNED : ROLES.USER;

        await context.db.patch(userId, { role: newRole });

        return { message: `User ${userId} has been ${ban ? "banned" : "unbanned"}.`, success: true };
    },
    returns: v.object({ message: v.string(), success: v.boolean() }),
});

export const updateUserSettings = authedMutation({
    args: {
        codeFont: v.optional(v.union(v.literal("fira-code"), v.literal("mono"), v.literal("consolas"), v.literal("jetbrains"), v.literal("source-code-pro"))),
        disableExternalLinkWarning: v.optional(v.boolean()),
        hidePersonalInfo: v.optional(v.boolean()),
        isAdvancedUser: v.optional(v.boolean()),
        lastChatId: v.optional(v.string()),
        mainFont: v.optional(v.union(v.literal("inter"), v.literal("system"), v.literal("serif"), v.literal("mono"), v.literal("roboto-slab"))),
        notifications: v.optional(
            v.object({
                vouchReceived: v.optional(v.boolean()),
            }),
        ),
        selectedModel: v.optional(v.string()),
        sendBehavior: v.optional(v.union(v.literal("enter"), v.literal("shiftEnter"), v.literal("button"))),
        showTimestamps: v.optional(v.boolean()),
    },
    handler: async (context, arguments_) => {
        const settings = await context.db
            .query("userSettings")
            .withIndex("by_userId", (q) => q.eq("userId", context.user.userId))
            .unique();

        const { ...rest } = arguments_;

        if (settings) {
            await context.db.patch(settings._id, rest);
        } else {
            await context.db.insert("userSettings", {
                userId: context.user.userId,
                ...rest,
            });
        }
    },
});

export const getUserSettings = authedQuery({
    args: {},
    handler: async (context) => {
        const settings = await context.db
            .query("userSettings")
            .withIndex("by_userId", (q) => q.eq("userId", context.user.userId))
            .unique();

        return settings;
    },
});
