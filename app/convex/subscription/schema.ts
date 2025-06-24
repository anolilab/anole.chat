import { defineTable } from "convex/server";
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

export const subscriptionTables = {
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
};
