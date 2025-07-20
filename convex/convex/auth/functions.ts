import { v } from "convex/values";
import {
    customAction,
    customCtx,
    customMutation,
    customQuery,
} from "convex-helpers/server/customFunctions";

import {
    action,
    mutation,
    query,
} from "../_generated/server";
import { getCurrentUserInternal } from "../auth/lib/helper";
import { encryptKey } from "../lib/encryption";
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
            const userId = context.user.userId;

            // Recursively encrypt all encryptedKey fields
            const toStore = await deepEncryptKeys(inputArguments);

            const settings = await context.db
                .query(tableName)
                .withIndex("by_userId", (q) => q.eq("userId", userId))
                .unique();

            if (tableName === "userSettings") {
                // Enhanced validation for shortcut format
                // Allows: single keys, modifier combinations, function keys, special keys
                const validPattern = /^((ctrl|cmd|meta|alt|shift)\+)*(f\d{1,2}|arrow(up|down|left|right)|space|enter|escape|tab|backspace|delete|[a-z0-9?])$/i;

                if (toStore.keyboardShortcuts) {
                    for (const key in toStore.keyboardShortcuts) {
                        if (!validPattern.test(toStore.keyboardShortcuts[key])) {
                            throw new Error("Invalid keyboard shortcut");
                        }
                    }
                }
            }


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
            const userId = context.user.userId;

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
