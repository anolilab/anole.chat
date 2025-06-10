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

const priceValidator = v.object({
    stripeId: v.string(),
    amount: v.number(),
});
const pricesValidator = v.object({
    [CURRENCIES.USD]: priceValidator,
    [CURRENCIES.EUR]: priceValidator,
});

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
        role: v.string(),
        updatedAt: v.string(),
    })
        .index("email", ["email"])
        .index("customerId", ["customerId"]),
        
    account: defineTable({
        accountId: v.id("user"),
        password: v.string(),
        providerId: v.string(),
        updatedAt: v.string(),
        userId: v.id("user"),
    }),

    session: defineTable({
        expiresAt: v.string(),
        token: v.string(),
        updatedAt: v.string(),
        ipAddress: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        userId: v.id("user"),
    })
        .index("byToken", ["token"])
        .index("byUserId", ["userId"]),
    jwks: defineTable({
        publicKey: v.string(),
        privateKey: v.string(),
    }),
    // End BetterAuth

    plans: defineTable({
        key: planKeyValidator,
        stripeId: v.string(),
        name: v.string(),
        description: v.string(),
        prices: v.object({
            [INTERVALS.MONTH]: pricesValidator,
            [INTERVALS.YEAR]: pricesValidator,
        }),
    })
        .index("key", ["key"])
        .index("stripeId", ["stripeId"]),

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
      .index("userId", ["userId"])
      .index("id", ["id"])
      .index("customerId", ["customerId"]),
});

export default schema;
