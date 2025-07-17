import { v } from "convex/values";
import {
    customAction,
    customCtx,
    customMutation,
    customQuery,
} from "convex-helpers/server/customFunctions";

import {
    action,
    internalMutation,
    mutation,
    query,
} from "../_generated/server";
import { getCurrentUserInternal, requireUserId } from "../auth/lib/helper";
import { encryptKey } from "../lib/encryption";
import type { Role } from "../lib/types";
import { ROLES } from "../lib/types";
import { aiUserPreferencesFields, userSettingsFields } from "./fields";
import { ConvexError } from "convex/values";

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

async function deepEncryptKeys(object: any): Promise<any> {
    if (Array.isArray(object)) {
        return Promise.all(object.map(deepEncryptKeys));
    }

    if (object && typeof object === "object") {
        const result: Record<string, any> = {};

        for (const [key, value] of Object.entries(object)) {
            result[key] = await (key === "encryptedKey" && typeof value === "string" && value ? encryptKey(value) : deepEncryptKeys(value));
        }

        return result;
    }

    return object;
}

const makeSettingsUpsertMutation = (
    // TODO: find the correct typing
    tableName: any,
    arguments_: Record<string, any>,
) => authedMutation({
    args: arguments_,
    handler: async (context, inputArguments) => {
        const userId = context.user._id;

        // Recursively encrypt all encryptedKey fields
        const toStore = await deepEncryptKeys(inputArguments);

        const settings = await context.db
            .query(tableName)
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .unique();

        if (settings) {
            await context.db.patch(settings._id, toStore);
        } else {
            await context.db.insert(tableName, {
                userId,
                ...toStore,
            });
        }
    },
});

const makeSettingsGetQuery = (
    // TODO: find the correct typing
    tableName: any,
) => authedQuery({
    args: {},
    handler: async (context) => {
        const userId = context.user._id;

        return await context.db
            .query(tableName)
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .unique();
    },
});

export const updateUserSettings = makeSettingsUpsertMutation(
    "userSettings",
    userSettingsFields,
);
export const getUserSettings = makeSettingsGetQuery("userSettings");

export const updateAIUserPreferences = makeSettingsUpsertMutation(
    "aiUserPreferences",
    aiUserPreferencesFields,
);

// Credit Management Functions
export const getUserCredits = authedQuery({
    args: {},
    handler: async (context) => {
        const userId = context.user._id;
        const user = await context.db.get(userId);
        return user?.credits ?? 0;
    },
    returns: v.number(),
});

export const updateUserCredits = authedMutation({
    args: { credits: v.number() },
    handler: async (context, { credits }) => {
        const userId = context.user._id;
        await context.db.patch(userId, { credits });
    },
    returns: v.null(),
});

export const deductCredits = authedMutation({
    args: { amount: v.number() },
    handler: async (context, { amount }) => {
        const userId = context.user._id;
        const user = await context.db.get(userId);
        
        if (!user) {
            throw new ConvexError("User not found");
        }
        
        const currentCredits = user.credits ?? 0;
        
        if (currentCredits < amount) {
            throw new ConvexError("Insufficient credits");
        }
        
        await context.db.patch(userId, { credits: currentCredits - amount });
    },
    returns: v.null(),
});

export const checkUserCredits = authedQuery({
    args: { requiredAmount: v.number() },
    handler: async (context, { requiredAmount }) => {
        const userId = context.user._id;
        const user = await context.db.get(userId);
        const currentCredits = user?.credits ?? 0;
        
        return {
            hasSufficientCredits: currentCredits >= requiredAmount,
            currentCredits,
            requiredAmount,
        };
    },
    returns: v.object({
        hasSufficientCredits: v.boolean(),
        currentCredits: v.number(),
        requiredAmount: v.number(),
    }),
});

export const getAIUserPreferences = makeSettingsGetQuery("aiUserPreferences");
