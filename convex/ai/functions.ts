import { action, internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { ENCRYPTION_KEY } from "../env";
import { authenticateUser } from "@cvx/user/lib/authenticateUser";
import { symmetricEncrypt, symmetricDecrypt } from "better-auth/crypto";

async function encryptApiKey(apiKey: string): Promise<string> {
    if (!ENCRYPTION_KEY) {
        throw new Error("ENCRYPTION_KEY environment variable is required");
    }

    return await symmetricEncrypt({
        key: ENCRYPTION_KEY,
        data: apiKey,
    });
}

async function decryptApiKey(encryptedKey: string): Promise<string> {
    if (!ENCRYPTION_KEY) {
        throw new Error("ENCRYPTION_KEY environment variable is required");
    }

    try {
        return await symmetricDecrypt({
            key: ENCRYPTION_KEY,
            data: encryptedKey,
        });
    } catch (error) {
        throw new Error("Failed to decrypt API key");
    }
}
// Public API functions
export const storeUserApiKey = action({
    args: {
        provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("google")),
        apiKey: v.string(),
        sessionToken: v.string(),
    },
    returns: v.object({
        success: v.boolean(),
        message: v.optional(v.string()),
    }),
    handler: async (ctx, args) => {
        const user = await authenticateUser(ctx, args.sessionToken);

        const encryptedKey = await encryptApiKey(args.apiKey);

        await ctx.runMutation(internal.ai.functions.deactivateExistingKeys, {
            userId: user.id,
            provider: args.provider,
        });

        // Store the new encrypted key
        await ctx.runMutation(internal.ai.functions.insertUserApiKey, {
            userId: user.id,
            provider: args.provider,
            encryptedKey,
        });

        return { success: true, message: "API key stored successfully" };
    },
});

export const removeUserApiKey = action({
    args: {
        provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("google")),
        sessionToken: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await authenticateUser(ctx, args.sessionToken);

        await ctx.runMutation(internal.ai.functions.deleteUserApiKeys, {
            userId: user.id,
            provider: args.provider,
        });

        return { success: true };
    },
});

export const getUserApiKeys = action({
    args: {
        sessionToken: v.string(),
    },
    handler: async (ctx, args): Promise<{ provider: string; hasKey: boolean; createdAt: number }[]> => {
        const user = await authenticateUser(ctx, args.sessionToken);

        return await ctx.runQuery(internal.ai.functions.getUserApiKeysInternal, {
            userId: user.id,
        });
    },
});

export const deactivateExistingKeys = internalMutation({
    args: {
        userId: v.id("user"),
        provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("google")),
    },
    handler: async (ctx, args) => {
        const existingKeys = await ctx.db
            .query("userApiKeys")
            .withIndex("by_user_provider", (q) => q.eq("userId", args.userId).eq("provider", args.provider))
            .collect();

        for (const existingKey of existingKeys) {
            await ctx.db.patch(existingKey._id, { isActive: false });
        }
    },
});

export const insertUserApiKey = internalMutation({
    args: {
        userId: v.id("user"),
        provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("google")),
        encryptedKey: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("userApiKeys", {
            userId: args.userId,
            provider: args.provider,
            encryptedKey: args.encryptedKey,
            isActive: true,
        });
    },
});

export const deleteUserApiKeys = internalMutation({
    args: {
        userId: v.id("user"),
        provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("google")),
    },
    handler: async (ctx, args) => {
        const existingKeys = await ctx.db
            .query("userApiKeys")
            .withIndex("by_user_provider", (q) => q.eq("userId", args.userId).eq("provider", args.provider))
            .collect();

        for (const existingKey of existingKeys) {
            await ctx.db.delete(existingKey._id);
        }
    },
});

export const getUserApiKeysInternal = internalQuery({
    args: {
        userId: v.id("user"),
    },
    handler: async (ctx, args) => {
        const keys = await ctx.db
            .query("userApiKeys")
            .withIndex("by_user_active", (q) => q.eq("userId", args.userId).eq("isActive", true))
            .collect();

        return keys.map((key) => ({
            provider: key.provider,
            hasKey: true,
            createdAt: key._creationTime,
        }));
    },
});

// Function to get decrypted API key for a user and provider
export const getDecryptedUserApiKey = internalQuery({
    args: {
        userId: v.id("user"),
        provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("google")),
    },
    handler: async (ctx, args) => {
        const userKey = await ctx.db
            .query("userApiKeys")
            .withIndex("by_user_provider", (q) => q.eq("userId", args.userId).eq("provider", args.provider))
            .filter((q) => q.eq(q.field("isActive"), true))
            .unique();

        if (!userKey) {
            return null;
        }

        try {
            const decryptedKey = await decryptApiKey(userKey.encryptedKey);
            return decryptedKey;
        } catch (error) {
            console.error("Failed to decrypt user API key:", error);
            return null;
        }
    },
});

// Model configuration functions
export const setUserModelConfig = action({
    args: {
        modelId: v.string(),
        provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("google")),
        useUserKey: v.boolean(),
        isDefault: v.optional(v.boolean()),
        sessionToken: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await authenticateUser(ctx, args.sessionToken);

        await ctx.runMutation(internal.ai.functions.setUserModelConfigInternal, {
            userId: user.id,
            modelId: args.modelId,
            provider: args.provider,
            useUserKey: args.useUserKey,
            isDefault: args.isDefault ?? false,
        });

        return { success: true };
    },
});

export const setUserModelConfigInternal = internalMutation({
    args: {
        userId: v.id("user"),
        modelId: v.string(),
        provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("google")),
        useUserKey: v.boolean(),
        isDefault: v.boolean(),
    },
    handler: async (ctx, args) => {
        // If setting as default, unset other defaults
        if (args.isDefault) {
            const existingDefaults = await ctx.db
                .query("userModelConfigs")
                .withIndex("by_user_default", (q) => q.eq("userId", args.userId).eq("isDefault", true))
                .collect();

            for (const config of existingDefaults) {
                await ctx.db.patch(config._id, { isDefault: false });
            }
        }

        // Check if config already exists
        const existingConfig = await ctx.db
            .query("userModelConfigs")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("modelId"), args.modelId))
            .unique();

        if (existingConfig) {
            await ctx.db.patch(existingConfig._id, {
                useUserKey: args.useUserKey,
                isDefault: args.isDefault,
            });
        } else {
            await ctx.db.insert("userModelConfigs", {
                userId: args.userId,
                modelId: args.modelId,
                provider: args.provider,
                useUserKey: args.useUserKey,
                isDefault: args.isDefault,
            });
        }
    },
});

export const getUserModelConfigs = action({
    args: {
        sessionToken: v.string(),
    },
    returns: v.any(),
    handler: async (ctx, args) => {
        const user = await authenticateUser(ctx, args.sessionToken);

        return await ctx.runQuery(internal.ai.functions.getUserModelConfigsInternal, {
            userId: user.id,
        });
    },
});

export const getUserModelConfigsInternal = internalQuery({
    args: {
        sessionToken: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await authenticateUser(ctx, args.sessionToken);

        return await ctx.db
            .query("userModelConfigs")
            .withIndex("by_user", (q) => q.eq("userId", user.id))
            .collect();
    },
});

export const getUserDefaultModel = action({
    args: {
        sessionToken: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await authenticateUser(ctx, args.sessionToken);

        return await ctx.runQuery(internal.ai.functions.getUserDefaultModelInternal, {
            userId: user.id,
        });
    },
});

export const getUserDefaultModelInternal = internalQuery({
    args: {
        sessionToken: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await authenticateUser(ctx, args.sessionToken);

        return await ctx.db
            .query("userModelConfigs")
            .withIndex("by_user_default", (q) => q.eq("userId", user.id).eq("isDefault", true))
            .unique();
    },
});

export const hasUserApiKey = action({
    args: {
        provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("google")),
        sessionToken: v.string(),
    },
    returns: v.object({
        hasKey: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const user = await authenticateUser(ctx, args.sessionToken);

        const hasKey = await ctx.runQuery(internal.ai.functions.checkUserApiKey, {
            userId: user.id,
            provider: args.provider,
        });

        return { hasKey };
    },
});

export const checkUserApiKey = internalQuery({
    args: {
        userId: v.id("user"),
        provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("google")),
    },
    handler: async (ctx, args) => {
        const userKey = await ctx.db
            .query("userApiKeys")
            .withIndex("by_user_provider", (q) => q.eq("userId", args.userId).eq("provider", args.provider))
            .filter((q) => q.eq(q.field("isActive"), true))
            .unique();

        return !!userKey;
    },
});

export const getUserAvailableProviders = action({
    args: {
        sessionToken: v.string(),
    },
    returns: v.any(),
    handler: async (ctx, args) => {
        const user = await authenticateUser(ctx, args.sessionToken);

        const providers = await ctx.runQuery(internal.ai.functions.getUserAvailableProvidersInternal, {
            userId: user.id,
        });

        return providers;
    },
});

export const getUserAvailableProvidersInternal = internalQuery({
    args: {
        userId: v.id("user"),
    },
    handler: async (ctx, args) => {
        const userKeys = await ctx.db
            .query("userApiKeys")
            .withIndex("by_user_active", (q) => q.eq("userId", args.userId).eq("isActive", true))
            .collect();

        const availableProviders = {
            openai: { hasUserKey: false, hasSystemKey: !!process.env.OPENAI_API_KEY },
            anthropic: { hasUserKey: false, hasSystemKey: !!process.env.ANTHROPIC_API_KEY },
            google: { hasUserKey: false, hasSystemKey: !!process.env.GOOGLE_API_KEY },
        };

        for (const key of userKeys) {
            if (key.provider in availableProviders) {
                availableProviders[key.provider as keyof typeof availableProviders].hasUserKey = true;
            }
        }

        return availableProviders;
    },
});
