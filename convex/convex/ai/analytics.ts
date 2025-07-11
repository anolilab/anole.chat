import { v } from "convex/values";

import { authedQuery } from "../auth/functions";
import { MODELS_SHARED } from "./lib/models";

const getDaysSinceEpoch = (daysAgo: number) =>
    Math.floor(Date.now() / (24 * 60 * 60 * 1000)) - daysAgo;

const getHoursSinceEpoch = (hoursAgo: number) =>
    Math.floor(Date.now() / (60 * 60 * 1000)) - hoursAgo;

export const getMyUsageStats = authedQuery({
    args: {
        timeframe: v.union(v.literal("1d"), v.literal("7d"), v.literal("30d")),
    },
    handler: async (context, { timeframe }) => {
        const days = timeframe === "1d" ? 1 : (timeframe === "7d" ? 7 : 30)
        const startDay = getDaysSinceEpoch(days);

        // Get user's events in time range - super efficient with the index
        const events = await context.db
            .query("usageEvents")
            .withIndex("byUserDay", (q) => q.eq("userId", context.user.userId).gte("daysSinceEpoch", startDay))
            .collect();

        // Post-filter by model and aggregate
        const modelStats = MODELS_SHARED.map((model) => {
            const modelEvents = events.filter((e) => e.modelId === model.id);

            return {
                completionTokens: modelEvents.reduce((sum, e) => sum + e.c, 0),
                modelId: model.id,
                modelName: model.name,
                promptTokens: modelEvents.reduce((sum, e) => sum + e.p, 0),
                reasoningTokens: modelEvents.reduce((sum, e) => sum + e.r, 0),
                requests: modelEvents.length,
                totalTokens: modelEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
            };
        }).filter((stat) => stat.requests > 0);

        const totalRequests = events.length;
        const totalTokens = events.reduce((sum, e) => sum + e.p + e.c + e.r, 0);

        return {
            modelStats,
            timeframe,
            totalRequests,
            totalTokens,
        };
    },
});

export const getMyUsageChartData = authedQuery({
    args: {
        timeframe: v.union(v.literal("1d"), v.literal("7d"), v.literal("30d")),
    },
    handler: async (
        context,
        { timeframe },
    ): Promise<
        {
            date: string;
            daysSinceEpoch?: number;
            hoursSinceEpoch?: number;
            models: Record<
                string,
                {
                    completionTokens: number;
                    promptTokens: number;
                    reasoningTokens: number;
                    requests: number;
                    tokens: number;
                }
            >;
            totalRequests: number;
            totalTokens: number;
        }[]
    > => {
        // For 1d, we want hourly granularity
        if (timeframe === "1d") {
            const hours = 24;
            const startTime = Date.now() - hours * 60 * 60 * 1000;

            // Get user's events in the last 24 hours
            const events = await context.db
                .query("usageEvents")
                .withIndex("byUserDay", (q) => q.eq("userId", user.id))
                .filter((q) => q.gte(q.field("_creationTime"), startTime))
                .collect();

            // Group by hour
            const chartData = [];

            for (let index = hours - 1; index >= 0; index--) {
                const hourStart = Date.now() - index * 60 * 60 * 1000;
                const hourEnd = Date.now() - (index - 1) * 60 * 60 * 1000;
                const hourEvents = events.filter(
                    (e) => e._creationTime >= hourStart && e._creationTime < hourEnd,
                );

                const hourData = {
                    date: new Date(hourStart).toISOString(),
                    hoursSinceEpoch: Math.floor(hourStart / (60 * 60 * 1000)),
                    models: {} as Record<
                        string,
                        {
                            completionTokens: number;
                            promptTokens: number;
                            reasoningTokens: number;
                            requests: number;
                            tokens: number;
                        }
                    >,
                    totalRequests: hourEvents.length,
                    totalTokens: hourEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
                };

                // Post-filter by model for this hour
                MODELS_SHARED.forEach((model) => {
                    const modelEvents = hourEvents.filter((e) => e.modelId === model.id);

                    if (modelEvents.length > 0) {
                        hourData.models[model.id] = {
                            completionTokens: modelEvents.reduce((sum, e) => sum + e.c, 0),
                            promptTokens: modelEvents.reduce((sum, e) => sum + e.p, 0),
                            reasoningTokens: modelEvents.reduce((sum, e) => sum + e.r, 0),
                            requests: modelEvents.length,
                            tokens: modelEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
                        };
                    }
                });

                chartData.push(hourData);
            }

            return chartData;
        }

        // Original daily logic for 7d and 30d
        const days = timeframe === "7d" ? 7 : 30;
        const startDay = getDaysSinceEpoch(days);

        // Get user's events in time range
        const events = await context.db
            .query("usageEvents")
            .withIndex("byUserDay", (q) => q.eq("userId", context.user.userId).gte("daysSinceEpoch", startDay))
            .collect();

        // Group by day
        const chartData = [];

        for (let index = days - 1; index >= 0; index--) {
            const daysSince = getDaysSinceEpoch(index);
            const dayEvents = events.filter((e) => e.daysSinceEpoch === daysSince);

            const dayData = {
                date: new Date(daysSince * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                daysSinceEpoch: daysSince,
                models: {} as Record<
                    string,
                    {
                        completionTokens: number;
                        promptTokens: number;
                        reasoningTokens: number;
                        requests: number;
                        tokens: number;
                    }
                >,
                totalRequests: dayEvents.length,
                totalTokens: dayEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
            };

            // Post-filter by model for this day
            MODELS_SHARED.forEach((model) => {
                const modelEvents = dayEvents.filter((e) => e.modelId === model.id);

                if (modelEvents.length > 0) {
                    dayData.models[model.id] = {
                        completionTokens: modelEvents.reduce((sum, e) => sum + e.c, 0),
                        promptTokens: modelEvents.reduce((sum, e) => sum + e.p, 0),
                        reasoningTokens: modelEvents.reduce((sum, e) => sum + e.r, 0),
                        requests: modelEvents.length,
                        tokens: modelEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
                    };
                }
            });

            chartData.push(dayData);
        }

        return chartData;
    },
});

export const getMyModelUsage = authedQuery({
    args: {
        modelId: v.string(),
        timeframe: v.union(v.literal("1d"), v.literal("7d"), v.literal("30d")),
    },
    handler: async (context, { modelId, timeframe }) => {
        const days = timeframe === "1d" ? 1 : (timeframe === "7d" ? 7 : 30)
        const startDay = getDaysSinceEpoch(days);

        // Get user's events, then filter by model
        const events = await context.db
            .query("usageEvents")
            .withIndex("byUserDay", (q) => q.eq("userId", context.user.userId).gte("daysSinceEpoch", startDay))
            .filter((q) => q.eq(q.field("modelId"), modelId))
            .collect();

        return {
            completionTokens: events.reduce((sum, e) => sum + e.c, 0),
            modelId,
            promptTokens: events.reduce((sum, e) => sum + e.p, 0),
            reasoningTokens: events.reduce((sum, e) => sum + e.r, 0),
            requests: events.length,
            timeframe,
            totalTokens: events.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
        };
    },
});
