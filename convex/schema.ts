import { defineSchema, defineTable } from "convex/server";
import { v, Infer } from "convex/values";

export const CURRENCIES = {
    USD: "usd",
    EUR: "eur",
} as const;
export const currencyValidator = v.union(v.literal(CURRENCIES.USD), v.literal(CURRENCIES.EUR));
export type Currency = Infer<typeof currencyValidator>;

export const INTERVALS = {
    MONTH: "month",
    YEAR: "year",
} as const;
export const intervalValidator = v.union(v.literal(INTERVALS.MONTH), v.literal(INTERVALS.YEAR));
export type Interval = Infer<typeof intervalValidator>;

export const PLANS = {
    FREE: "free",
    PRO: "pro",
} as const;
export const planKeyValidator = v.union(v.literal(PLANS.FREE), v.literal(PLANS.PRO));
export type PlanKey = Infer<typeof planKeyValidator>;

const schema = defineSchema({
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

    subscription: defineTable({
        id: v.string(),
        createdAt: v.number(),
        modifiedAt: v.optional(v.number()),
        amount: v.number(),
        currency: currencyValidator,
        recurringInterval: intervalValidator,
        status: v.string(),
        currentPeriodStart: v.number(),
        currentPeriodEnd: v.number(),
        cancelAtPeriodEnd: v.boolean(),
        canceledAt: v.optional(v.number()),
        startedAt: v.number(),
        endsAt: v.optional(v.number()),
        endedAt: v.optional(v.number()),
        customerId: v.string(),
        productId: v.string(),
        discountId: v.optional(v.string()),
        checkoutId: v.string(),
        customerCancellationReason: v.optional(v.string()),
        customerCancellationComment: v.optional(v.string()),
        metadata: v.optional(v.string()), // JSON string
        customFieldData: v.optional(v.string()), // JSON string
        userId: v.id("user"),
    })
        .index("by_userId", ["userId"])
        .index("by_subscription_id", ["id"])
        .index("by_customerId", ["customerId"]),

    vouches: defineTable({
        fromUserId: v.id("user"),
        toUserId: v.id("user"),
        rating: v.number(), // 1-5
        comment: v.optional(v.string()),
    })
        .index("by_toUserId", ["toUserId"])
        .index("by_fromUserId", ["fromUserId"])
        .index("by_toUserId_and_fromUserId", ["toUserId", "fromUserId"]),

    userSettings: defineTable({
        userId: v.id("user"),
        notifications: v.optional(
            v.object({
                vouchReceived: v.optional(v.boolean()),
            }),
        ),
        selectedAgent: v.optional(v.string()),
    }).index("by_userId", ["userId"]),

    // Thread relationships for branching and hierarchy
    threadRelationships: defineTable({
        threadId: v.string(), // The child thread
        parentThreadId: v.string(), // The parent thread this was branched from
        branchPoint: v.optional(v.number()), // Which message index the branch started from (0-based)
        branchType: v.optional(v.union(v.literal("branch"), v.literal("continuation"))), // Type of relationship
        createdAt: v.number(), // When this relationship was created
    })
        .index("by_thread", ["threadId"])
        .index("by_parent", ["parentThreadId"])
        .index("by_parent_and_thread", ["parentThreadId", "threadId"]),

    // Pinned threads for users
    pinnedThreads: defineTable({
        userId: v.id("user"), // The user who pinned the thread
        threadId: v.string(), // The thread that was pinned
        pinnedAt: v.number(), // When the thread was pinned
    })
        .index("by_user", ["userId"])
        .index("by_thread", ["threadId"])
        .index("by_user_and_thread", ["userId", "threadId"]),

    // Thread ordering for users
    threadOrder: defineTable({
        userId: v.id("user"), // The user who set the order
        threadId: v.string(), // The thread being ordered
        order: v.number(), // The order position (lower numbers appear first)
        updatedAt: v.number(), // When the order was last updated
    })
        .index("by_user", ["userId"])
        .index("by_user_and_order", ["userId", "order"])
        .index("by_user_and_thread", ["userId", "threadId"]),
});

export default schema;
