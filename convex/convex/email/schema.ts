import { defineTable } from "convex/server";
import { v } from "convex/values";

const emailTables = {
    emails: defineTable({
        email: v.string(),
        expectation: v.union(
            v.literal("delivered"),
            v.literal("bounced"),
            v.literal("complained"),
        ),
    }).index("by_email", ["email"]),
};

export default emailTables;
