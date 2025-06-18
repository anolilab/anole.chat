import { defineTable } from "convex/server";
import { v } from "convex/values";

export const aiTables = {
    userApiKeys: defineTable({
        userId: v.id("user"),
        provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("google")),
        encryptedKey: v.string(),
        isActive: v.boolean(),
    })
        .index("by_user", ["userId"])
        .index("by_user_provider", ["userId", "provider"])
        .index("by_user_active", ["userId", "isActive"]),

    userModelConfigs: defineTable({
        userId: v.id("user"),
        modelId: v.string(), // e.g., "gpt-4o-mini", "claude-3-5-sonnet"
        provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("google")),
        useUserKey: v.boolean(), // Whether to use user's API key for this model
        isDefault: v.boolean(), // Whether this is the user's default model
    })
        .index("by_user", ["userId"])
        .index("by_user_default", ["userId", "isDefault"])
        .index("by_user_provider", ["userId", "provider"]),
};
