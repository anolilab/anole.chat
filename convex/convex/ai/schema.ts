import { defineTable } from "convex/server";
import { v } from "convex/values";

export const ai = {
    usageEvents: defineTable(v.object({
        userId: v.string(),
        modelId: v.string(), // "openai:gpt-4o"
        p: v.number(),
        c: v.number(),
        r: v.number(),
        daysSinceEpoch: v.number() // Math.floor(Date.now() / (24*60*60*1000))
    })).index("byUserDay", ["userId", "daysSinceEpoch"]),
};
