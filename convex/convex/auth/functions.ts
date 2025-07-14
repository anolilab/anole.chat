import { v } from "convex/values";
import { customAction, customCtx, customMutation, customQuery } from "convex-helpers/server/customFunctions";

import { action, internalMutation, mutation, query } from "../_generated/server";
import { requireUserId, getCurrentUserInternal } from "../auth/lib/helper";
import type { Role } from "../lib/types";
import { ROLES } from "../lib/types";
import { userSettingsFields, aiUserPreferencesFields } from "./fields";
import { encryptKey } from "../lib/encryption";

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
    args: { email: v.optional(v.string()), userId: v.id("users") }, // email is passed but not strictly used in this version
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
        userId: v.id("users"),
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
    args: { ban: v.boolean(), userId: v.id("users") },
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

async function deepEncryptKeys(obj: any): Promise<any> {
    if (Array.isArray(obj)) {
        return Promise.all(obj.map(deepEncryptKeys));
    } else if (obj && typeof obj === "object") {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
            if (key === "encryptedKey" && typeof value === "string" && value) {
                result[key] = await encryptKey(value);
            } else {
                result[key] = await deepEncryptKeys(value);
            }
        }
        return result;
    } else {
        return obj;
    }
}

const makeSettingsUpsertMutation = (
    // TODO: find the correct typing
    tableName: any,
    args: Record<string, any>,
) => {
    return authedMutation({
        args,
        handler: async (context, inputArgs) => {
            console.log(context.user)
            const userId = context.user._id;

            // Recursively encrypt all encryptedKey fields
            const toStore = await deepEncryptKeys(inputArgs);

            const settings = await context.db
                .query(tableName)
                .withIndex("by_userId", (q) => q.eq("userId", userId))
                .unique();

            if (settings) {
                await context.db.patch(settings._id, toStore);
            } else {
                await context.db.insert(tableName, {
                    ["userId"]: userId,
                    ...toStore,
                });
            }
        },
    });
};

const makeSettingsGetQuery = (
    // TODO: find the correct typing
    tableName: any,
) => {
    return authedQuery({
        args: {},
        handler: async (context) => {
            const userId = context.user._id;

            return await context.db
                .query(tableName)
                .withIndex("by_userId", (q) => q.eq("userId", userId))
                .unique();
        },
    });
};

export const updateUserSettings = makeSettingsUpsertMutation("userSettings", userSettingsFields);
export const getUserSettings = makeSettingsGetQuery("userSettings");

export const updateAIUserPreferences = makeSettingsUpsertMutation("aiUserPreferences", aiUserPreferencesFields);
export const getAIUserPreferences = makeSettingsGetQuery("aiUserPreferences");
