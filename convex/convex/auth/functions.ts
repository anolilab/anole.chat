import { v } from "convex/values";
import {
    customAction,
    customCtx,
    customMutation,
    customQuery,
} from "convex-helpers/server/customFunctions";
import { paginator } from "convex-helpers/server/pagination";
import { paginationOptsValidator } from "convex/server";

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

// Usage Tracking Functions
export const logCreditTransaction = internalMutation({
    args: {
        amount: v.number(),
        description: v.string(),
        metadata: v.optional(v.any()),
        transactionType: v.union(
            v.literal("initial_allocation"),
            v.literal("message_consumption"),
            v.literal("manual_adjustment"),
            v.literal("subscription_credit"),
            v.literal("purchase_credit"),
            v.literal("refund"),
            v.literal("expiration"),
        ),
        userId: v.id("users"),
    },
    handler: async (context, { amount, description, metadata, transactionType, userId }) => {
        const user = await context.db.get(userId);
        const balanceBefore = user?.credits ?? 0;
        const balanceAfter = balanceBefore + amount;

        // Log the transaction
        await context.db.insert("creditTransactions", {
            amount,
            balanceAfter,
            balanceBefore,
            description,
            metadata,
            transactionType,
            userId,
        });

        // Update daily usage stats
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const existingStats = await context.db
            .query("dailyUsageStats")
            .withIndex("by_userId_and_date", (q) => 
                q.eq("userId", userId).eq("date", today)
            )
            .unique();

        if (existingStats) {
            // Update existing stats
            const updates: any = {};
            
            if (amount > 0) {
                updates.creditsAdded = existingStats.creditsAdded + amount;
            } else {
                updates.creditsConsumed = existingStats.creditsConsumed + Math.abs(amount);
            }

            if (transactionType === "message_consumption") {
                updates.messageCount = existingStats.messageCount + 1;
            }

            // Update model usage if metadata contains model info
            if (metadata?.model && transactionType === "message_consumption") {
                const currentModelUsage = existingStats.modelUsage || {};
                const modelName = metadata.model;
                currentModelUsage[modelName] = (currentModelUsage[modelName] || 0) + 1;
                updates.modelUsage = currentModelUsage;
            }

            await context.db.patch(existingStats._id, updates);
        } else {
            // Create new daily stats
            const newStats: any = {
                creditsAdded: amount > 0 ? amount : 0,
                creditsConsumed: amount < 0 ? Math.abs(amount) : 0,
                date: today,
                messageCount: transactionType === "message_consumption" ? 1 : 0,
                userId,
            };

            if (metadata?.model && transactionType === "message_consumption") {
                newStats.modelUsage = { [metadata.model]: 1 };
            }

            await context.db.insert("dailyUsageStats", newStats);
        }
    },
    returns: v.null(),
});

// Enhanced credit functions with tracking
export const deductCreditsWithTracking = authedMutation({
    args: { 
        amount: v.number(),
        description: v.string(),
        metadata: v.optional(v.any()),
    },
    handler: async (context, { amount, description, metadata }) => {
        const userId = context.user._id;
        const user = await context.db.get(userId);
        
        if (!user) {
            throw new ConvexError("User not found");
        }
        
        const currentCredits = user.credits ?? 0;
        
        if (currentCredits < amount) {
            throw new ConvexError("Insufficient credits");
        }
        
        // Update user credits
        await context.db.patch(userId, { credits: currentCredits - amount });
        
        // Log the transaction
        await context.runMutation(internal.auth.functions.logCreditTransaction, {
            amount: -amount, // Negative for consumption
            description,
            metadata,
            transactionType: "message_consumption",
            userId,
        });
    },
    returns: v.null(),
});

export const addCreditsWithTracking = authedMutation({
    args: { 
        amount: v.number(),
        description: v.string(),
        transactionType: v.union(
            v.literal("manual_adjustment"),
            v.literal("subscription_credit"),
            v.literal("purchase_credit"),
            v.literal("refund"),
        ),
        metadata: v.optional(v.any()),
    },
    handler: async (context, { amount, description, transactionType, metadata }) => {
        const userId = context.user._id;
        const user = await context.db.get(userId);
        
        if (!user) {
            throw new ConvexError("User not found");
        }
        
        const currentCredits = user.credits ?? 0;
        
        // Update user credits
        await context.db.patch(userId, { credits: currentCredits + amount });
        
        // Log the transaction
        await context.runMutation(internal.auth.functions.logCreditTransaction, {
            amount, // Positive for addition
            description,
            metadata,
            transactionType,
            userId,
        });
    },
    returns: v.null(),
});

// Usage Analytics Functions
export const getUserTransactionHistory = authedQuery({
    args: { 
        paginationOpts: paginationOptsValidator,
        transactionType: v.optional(v.union(
            v.literal("initial_allocation"),
            v.literal("message_consumption"),
            v.literal("manual_adjustment"),
            v.literal("subscription_credit"),
            v.literal("purchase_credit"),
            v.literal("refund"),
            v.literal("expiration"),
        )),
    },
    handler: async (context, { paginationOpts, transactionType }) => {
        const userId = context.user._id;
        
        let query = context.db.query("creditTransactions")
            .withIndex("by_userId", (q) => q.eq("userId", userId));
            
        if (transactionType) {
            query = context.db.query("creditTransactions")
                .withIndex("by_userId_and_type", (q) => 
                    q.eq("userId", userId).eq("transactionType", transactionType)
                );
        }
        
        const results = await paginator(query, paginationOpts);
        
        return {
            ...results,
            page: results.page.map(transaction => ({
                ...transaction,
                // Add human-readable date
                formattedDate: new Date(transaction._creationTime).toLocaleDateString(),
            })),
        };
    },
    returns: v.object({
        continueCursor: v.union(v.string(), v.null()),
        isDone: v.boolean(),
        page: v.array(v.object({
            _creationTime: v.number(),
            _id: v.id("creditTransactions"),
            amount: v.number(),
            balanceAfter: v.number(),
            balanceBefore: v.number(),
            description: v.string(),
            formattedDate: v.string(),
            metadata: v.optional(v.any()),
            transactionType: v.union(
                v.literal("initial_allocation"),
                v.literal("message_consumption"),
                v.literal("manual_adjustment"),
                v.literal("subscription_credit"),
                v.literal("purchase_credit"),
                v.literal("refund"),
                v.literal("expiration"),
            ),
            userId: v.id("users"),
        })),
    }),
});

export const getUserUsageStats = authedQuery({
    args: { 
        days: v.optional(v.number()), // Number of days to look back, default 30
    },
    handler: async (context, { days = 30 }) => {
        const userId = context.user._id;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        // Get daily stats for the period
        const dailyStats = await context.db
            .query("dailyUsageStats")
            .withIndex("by_userId_and_date", (q) => 
                q.eq("userId", userId).gte("date", startDateStr).lte("date", endDateStr)
            )
            .collect();
        
        // Calculate totals
        const totals = dailyStats.reduce((acc, stat) => ({
            creditsConsumed: acc.creditsConsumed + stat.creditsConsumed,
            creditsAdded: acc.creditsAdded + stat.creditsAdded,
            messageCount: acc.messageCount + stat.messageCount,
        }), { creditsConsumed: 0, creditsAdded: 0, messageCount: 0 });
        
        // Aggregate model usage
        const modelUsage: Record<string, number> = {};
        dailyStats.forEach(stat => {
            if (stat.modelUsage) {
                Object.entries(stat.modelUsage).forEach(([model, count]) => {
                    modelUsage[model] = (modelUsage[model] || 0) + count;
                });
            }
        });
        
        // Get recent transactions for context
        const recentTransactions = await context.db
            .query("creditTransactions")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .order("desc")
            .take(5);
        
        return {
            dailyStats: dailyStats.map(stat => ({
                ...stat,
                formattedDate: new Date(stat.date).toLocaleDateString(),
            })),
            modelUsage,
            recentTransactions: recentTransactions.map(transaction => ({
                ...transaction,
                formattedDate: new Date(transaction._creationTime).toLocaleDateString(),
            })),
            totals,
        };
    },
    returns: v.object({
        dailyStats: v.array(v.object({
            _creationTime: v.number(),
            _id: v.id("dailyUsageStats"),
            creditsAdded: v.number(),
            creditsConsumed: v.number(),
            date: v.string(),
            formattedDate: v.string(),
            messageCount: v.number(),
            modelUsage: v.optional(v.record(v.string(), v.number())),
            totalCost: v.optional(v.number()),
            userId: v.id("users"),
        })),
        modelUsage: v.record(v.string(), v.number()),
        recentTransactions: v.array(v.object({
            _creationTime: v.number(),
            _id: v.id("creditTransactions"),
            amount: v.number(),
            balanceAfter: v.number(),
            balanceBefore: v.number(),
            description: v.string(),
            formattedDate: v.string(),
            metadata: v.optional(v.any()),
            transactionType: v.union(
                v.literal("initial_allocation"),
                v.literal("message_consumption"),
                v.literal("manual_adjustment"),
                v.literal("subscription_credit"),
                v.literal("purchase_credit"),
                v.literal("refund"),
                v.literal("expiration"),
            ),
            userId: v.id("users"),
        })),
        totals: v.object({
            creditsConsumed: v.number(),
            creditsAdded: v.number(),
            messageCount: v.number(),
        }),
    }),
});

// Admin Functions for Usage Analytics
export const getSystemUsageStats = authedQuery({
    args: { 
        days: v.optional(v.number()), // Number of days to look back, default 30
    },
    handler: async (context, { days = 30 }) => {
        // Check if user is admin
        const user = await context.db.get(context.user._id);
        if (user?.role !== "admin") {
            throw new ConvexError("Admin access required");
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        // Get all daily stats for the period
        const allDailyStats = await context.db
            .query("dailyUsageStats")
            .withIndex("by_date", (q) => 
                q.gte("date", startDateStr).lte("date", endDateStr)
            )
            .collect();
        
        // Calculate system-wide totals
        const systemTotals = allDailyStats.reduce((acc, stat) => ({
            creditsConsumed: acc.creditsConsumed + stat.creditsConsumed,
            creditsAdded: acc.creditsAdded + stat.creditsAdded,
            messageCount: acc.messageCount + stat.messageCount,
            uniqueUsers: new Set([...acc.uniqueUsers, stat.userId]).size,
        }), { creditsConsumed: 0, creditsAdded: 0, messageCount: 0, uniqueUsers: 0 });
        
        // Aggregate model usage across all users
        const systemModelUsage: Record<string, number> = {};
        allDailyStats.forEach(stat => {
            if (stat.modelUsage) {
                Object.entries(stat.modelUsage).forEach(([model, count]) => {
                    systemModelUsage[model] = (systemModelUsage[model] || 0) + count;
                });
            }
        });
        
        // Get top users by usage
        const userUsageMap = new Map<string, { creditsConsumed: number; messageCount: number }>();
        allDailyStats.forEach(stat => {
            const existing = userUsageMap.get(stat.userId) || { creditsConsumed: 0, messageCount: 0 };
            userUsageMap.set(stat.userId, {
                creditsConsumed: existing.creditsConsumed + stat.creditsConsumed,
                messageCount: existing.messageCount + stat.messageCount,
            });
        });
        
        const topUsers = Array.from(userUsageMap.entries())
            .map(([userId, usage]) => ({ userId, ...usage }))
            .sort((a, b) => b.creditsConsumed - a.creditsConsumed)
            .slice(0, 10);
        
        // Get user details for top users
        const topUsersWithDetails = await Promise.all(
            topUsers.map(async ({ userId, ...usage }) => {
                const user = await context.db.get(userId);
                return {
                    ...usage,
                    email: user?.email || "Unknown",
                    name: user?.name || "Unknown",
                };
            })
        );
        
        return {
            systemTotals: {
                ...systemTotals,
                uniqueUsers: systemTotals.uniqueUsers,
            },
            systemModelUsage,
            topUsers: topUsersWithDetails,
            dailyStats: allDailyStats.map(stat => ({
                ...stat,
                formattedDate: new Date(stat.date).toLocaleDateString(),
            })),
        };
    },
    returns: v.object({
        systemTotals: v.object({
            creditsConsumed: v.number(),
            creditsAdded: v.number(),
            messageCount: v.number(),
            uniqueUsers: v.number(),
        }),
        systemModelUsage: v.record(v.string(), v.number()),
        topUsers: v.array(v.object({
            creditsConsumed: v.number(),
            email: v.string(),
            messageCount: v.number(),
            name: v.string(),
            userId: v.id("users"),
        })),
        dailyStats: v.array(v.object({
            _creationTime: v.number(),
            _id: v.id("dailyUsageStats"),
            creditsAdded: v.number(),
            creditsConsumed: v.number(),
            date: v.string(),
            formattedDate: v.string(),
            messageCount: v.number(),
            modelUsage: v.optional(v.record(v.string(), v.number())),
            totalCost: v.optional(v.number()),
            userId: v.id("users"),
        })),
    }),
});

export const getAIUserPreferences = makeSettingsGetQuery("aiUserPreferences");
