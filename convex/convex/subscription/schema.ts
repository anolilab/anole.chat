import { defineTable } from "convex/server";
import type { Infer } from "convex/values";
import { v } from "convex/values";

export const CURRENCIES = {
    EUR: "eur",
    USD: "usd",
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
    subscriptions: defineTable({
        amount: v.number(),
        cancelAtPeriodEnd: v.boolean(),
        canceledAt: v.optional(v.number()),
        checkoutId: v.string(),
        createdAt: v.number(),
        currency: currencyValidator,
        currentPeriodEnd: v.number(),
        currentPeriodStart: v.number(),
        customerCancellationComment: v.optional(v.string()),
        customerCancellationReason: v.optional(v.string()),
        customerId: v.string(),
        customFieldData: v.optional(v.string()), // JSON string
        discountId: v.optional(v.string()),
        endedAt: v.optional(v.number()),
        endsAt: v.optional(v.number()),
        id: v.string(),
        metadata: v.optional(v.string()), // JSON string
        modifiedAt: v.optional(v.number()),
        productId: v.string(),
        recurringInterval: intervalValidator,
        startedAt: v.number(),
        status: v.string(),
        userId: v.string(),
    })
        .index("by_userId", ["userId"])
        .index("by_subscription_id", ["id"])
        .index("by_customerId", ["customerId"]),
};
