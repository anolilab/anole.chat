import { defineTable } from "convex/server";
import { v } from "convex/values";

export const authTables = {
    // Start BetterAuth
    user: defineTable({
        name: v.optional(v.string()),
        username: v.optional(v.string()),
        imageId: v.optional(v.id("_storage")),
        image: v.optional(v.string()),
        email: v.optional(v.string()),
        emailVerified: v.boolean(),
        phone: v.optional(v.string()),
        phoneVerificationTime: v.optional(v.number()),
        isAnonymous: v.optional(v.boolean()),
        customerId: v.optional(v.string()),
        role: v.union(v.literal("user"), v.literal("admin"), v.literal("banned")),
        updatedAt: v.string(),
    })
        .index("by_email", ["email"])
        .index("by_customerId", ["customerId"]),

    account: defineTable({
        accountId: v.string(),
        providerId: v.string(),
        userId: v.id("user"),
        accessToken: v.optional(v.string()),
        refreshToken: v.optional(v.string()),
        idToken: v.optional(v.string()),
        accessTokenExpiresAt: v.optional(v.string()),
        refreshTokenExpiresAt: v.optional(v.string()),
        scope: v.optional(v.string()),
        password: v.optional(v.string()),
        updatedAt: v.string(),
    }).index("by_userId", ["userId"]),

    session: defineTable({
        expiresAt: v.string(),
        token: v.string(),
        updatedAt: v.string(),
        ipAddress: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        userId: v.id("user"),
    })
        .index("by_token", ["token"])
        .index("by_userId", ["userId"]),

    verification: defineTable({
        identifier: v.string(),
        value: v.string(),
        expiresAt: v.string(),
        updatedAt: v.optional(v.string()),
    }),

    jwks: defineTable({
        publicKey: v.string(),
        privateKey: v.string(),
    }),
    // End BetterAuth
};
