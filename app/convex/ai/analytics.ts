import { v } from "convex/values"
import { MODELS_SHARED } from "./lib/models"
import { authedQuery } from "@convex/auth/functions"

const getDaysSinceEpoch = (daysAgo: number) =>
    Math.floor(Date.now() / (24 * 60 * 60 * 1000)) - daysAgo

const getHoursSinceEpoch = (hoursAgo: number) =>
    Math.floor(Date.now() / (60 * 60 * 1000)) - hoursAgo

export const getMyUsageStats = authedQuery({
    args: {
        timeframe: v.union(v.literal("1d"), v.literal("7d"), v.literal("30d"))
    },
    handler: async (ctx, { timeframe }) => {
        const days = timeframe === "1d" ? 1 : timeframe === "7d" ? 7 : 30
        const startDay = getDaysSinceEpoch(days)

        // Get user's events in time range - super efficient with the index
        const events = await ctx.db
            .query("usageEvents")
            .withIndex("byUserDay", (q) => q.eq("userId", ctx.user.userId).gte("daysSinceEpoch", startDay))
            .collect()

        // Post-filter by model and aggregate
        const modelStats = MODELS_SHARED.map((model) => {
            const modelEvents = events.filter((e) => e.modelId === model.id)
            return {
                modelId: model.id,
                modelName: model.name,
                requests: modelEvents.length,
                promptTokens: modelEvents.reduce((sum, e) => sum + e.p, 0),
                completionTokens: modelEvents.reduce((sum, e) => sum + e.c, 0),
                reasoningTokens: modelEvents.reduce((sum, e) => sum + e.r, 0),
                totalTokens: modelEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0)
            }
        }).filter((stat) => stat.requests > 0)

        const totalRequests = events.length
        const totalTokens = events.reduce((sum, e) => sum + e.p + e.c + e.r, 0)

        return {
            modelStats,
            timeframe,
            totalRequests,
            totalTokens
        }
    }
})

export const getMyUsageChartData = authedQuery({
    args: {
        timeframe: v.union(v.literal("1d"), v.literal("7d"), v.literal("30d"))
    },
    handler: async (
        ctx,
        { timeframe }
    ): Promise<
        {
            daysSinceEpoch?: number
            hoursSinceEpoch?: number
            date: string
            totalRequests: number
            totalTokens: number
            models: Record<
                string,
                {
                    requests: number
                    tokens: number
                    promptTokens: number
                    completionTokens: number
                    reasoningTokens: number
                }
            >
        }[]
    > => {
        // For 1d, we want hourly granularity
        if (timeframe === "1d") {
            const hours = 24
            const startTime = Date.now() - hours * 60 * 60 * 1000

            // Get user's events in the last 24 hours
            const events = await ctx.db
                .query("usageEvents")
                .withIndex("byUserDay", (q) => q.eq("userId", user.id))
                .filter((q) => q.gte(q.field("_creationTime"), startTime))
                .collect()

            // Group by hour
            const chartData = []
            for (let i = hours - 1; i >= 0; i--) {
                const hourStart = Date.now() - i * 60 * 60 * 1000
                const hourEnd = Date.now() - (i - 1) * 60 * 60 * 1000
                const hourEvents = events.filter(
                    (e) => e._creationTime >= hourStart && e._creationTime < hourEnd
                )

                const hourData = {
                    hoursSinceEpoch: Math.floor(hourStart / (60 * 60 * 1000)),
                    date: new Date(hourStart).toISOString(),
                    totalRequests: hourEvents.length,
                    totalTokens: hourEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
                    models: {} as Record<
                        string,
                        {
                            requests: number
                            tokens: number
                            promptTokens: number
                            completionTokens: number
                            reasoningTokens: number
                        }
                    >
                }

                // Post-filter by model for this hour
                MODELS_SHARED.forEach((model) => {
                    const modelEvents = hourEvents.filter((e) => e.modelId === model.id)
                    if (modelEvents.length > 0) {
                        hourData.models[model.id] = {
                            requests: modelEvents.length,
                            tokens: modelEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
                            promptTokens: modelEvents.reduce((sum, e) => sum + e.p, 0),
                            completionTokens: modelEvents.reduce((sum, e) => sum + e.c, 0),
                            reasoningTokens: modelEvents.reduce((sum, e) => sum + e.r, 0)
                        }
                    }
                })

                chartData.push(hourData)
            }

            return chartData
        }

        // Original daily logic for 7d and 30d
        const days = timeframe === "7d" ? 7 : 30
        const startDay = getDaysSinceEpoch(days)

        // Get user's events in time range
        const events = await ctx.db
            .query("usageEvents")
            .withIndex("byUserDay", (q) => q.eq("userId", ctx.user.userId).gte("daysSinceEpoch", startDay))
            .collect()

        // Group by day
        const chartData = [];

        for (let i = days - 1; i >= 0; i--) {
            const daysSince = getDaysSinceEpoch(i)
            const dayEvents = events.filter((e) => e.daysSinceEpoch === daysSince)

            const dayData = {
                daysSinceEpoch: daysSince,
                date: new Date(daysSince * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                totalRequests: dayEvents.length,
                totalTokens: dayEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
                models: {} as Record<
                    string,
                    {
                        requests: number
                        tokens: number
                        promptTokens: number
                        completionTokens: number
                        reasoningTokens: number
                    }
                >
            }

            // Post-filter by model for this day
            MODELS_SHARED.forEach((model) => {
                const modelEvents = dayEvents.filter((e) => e.modelId === model.id)
                if (modelEvents.length > 0) {
                    dayData.models[model.id] = {
                        requests: modelEvents.length,
                        tokens: modelEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
                        promptTokens: modelEvents.reduce((sum, e) => sum + e.p, 0),
                        completionTokens: modelEvents.reduce((sum, e) => sum + e.c, 0),
                        reasoningTokens: modelEvents.reduce((sum, e) => sum + e.r, 0)
                    }
                }
            })

            chartData.push(dayData)
        }

        return chartData
    }
})

export const getMyModelUsage = authedQuery({
    args: {
        modelId: v.string(),
        timeframe: v.union(v.literal("1d"), v.literal("7d"), v.literal("30d"))
    },
    handler: async (ctx, { modelId, timeframe }) => {
        const days = timeframe === "1d" ? 1 : timeframe === "7d" ? 7 : 30
        const startDay = getDaysSinceEpoch(days)

        // Get user's events, then filter by model
        const events = await ctx.db
            .query("usageEvents")
            .withIndex("byUserDay", (q) => q.eq("userId", ctx.user.userId).gte("daysSinceEpoch", startDay))
            .filter((q) => q.eq(q.field("modelId"), modelId))
            .collect()

        return {
            modelId,
            requests: events.length,
            promptTokens: events.reduce((sum, e) => sum + e.p, 0),
            completionTokens: events.reduce((sum, e) => sum + e.c, 0),
            reasoningTokens: events.reduce((sum, e) => sum + e.r, 0),
            totalTokens: events.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
            timeframe
        }
    }
})