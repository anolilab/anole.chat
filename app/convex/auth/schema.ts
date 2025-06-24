import { defineTable } from "convex/server";
import { v } from "convex/values";

export const authTables = {
    user: defineTable({
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        email: v.string(),
        customerId: v.optional(v.string()),
        role: v.union(v.literal("user"), v.literal("admin"), v.literal("banned")),
    }).index("by_email", ["email"]),
};
