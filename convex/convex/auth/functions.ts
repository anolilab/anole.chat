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
import { getCurrentUserInternal } from "../auth/lib/helper";
import { encryptKey } from "../lib/encryption";
import { ROLES } from "../lib/types";
import { aiUserPreferencesFields, userSettingsFields } from "./fields";

const deepEncryptKeys = async (object: any): Promise<any> => {
    if (Array.isArray(object)) {
        return Promise.all(object.map(deepEncryptKeys));
    }

    if (object && typeof object === "object") {
        const result: Record<string, any> = {};

        for (const [key, value] of Object.entries(object)) {
            result[key] = await (key === "encryptedKey"
                && typeof value === "string"
                && value
                ? encryptKey(value)
                : deepEncryptKeys(value));
        }

        return result;
    }

    return object;
};

const makeSettingsUpsertMutation = (
    // TODO: find the correct typing
    tableName: any,
    arguments_: Record<string, any>,
) =>
    authedMutation({
        args: arguments_,
        handler: async (context, inputArguments) => {
            const { userId } = context.user;

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
) =>
    authedQuery({
        args: {},
        handler: async (context) => {
            const { userId } = context.user;

            return await context.db
                .query(tableName)
                .withIndex("by_userId", (q) => q.eq("userId", userId))
                .unique();
        },
    });

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

export const updateUserSettings = makeSettingsUpsertMutation(
    "userSettings",
    userSettingsFields,
);
export const getUserSettings = makeSettingsGetQuery("userSettings");

export const updateAIUserPreferences = makeSettingsUpsertMutation(
    "aiUserPreferences",
    aiUserPreferencesFields,
);
export const getAIUserPreferences = makeSettingsGetQuery("aiUserPreferences");
