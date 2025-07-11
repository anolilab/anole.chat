import { defineTable } from "convex/server";
import { v } from "convex/values";

export const ai = {
    usageEvents: defineTable(v.object({
        c: v.number(),
        daysSinceEpoch: v.number(), // Math.floor(Date.now() / (24*60*60*1000))
        modelId: v.string(), // "openai:gpt-4o"
        p: v.number(),
        r: v.number(),
        userId: v.string(),
    })).index("byUserDay", ["userId", "daysSinceEpoch"]),
};
