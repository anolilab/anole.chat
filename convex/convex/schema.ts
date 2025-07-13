import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import ai from "./ai/schema";
import authTables from "./auth/schema";
import chatTables from "./chat/schema";
import emailTables from "./email/schema";
import { subscriptionTables } from "./subscription/schema";

const filesTables = {
    files: defineTable({
        fileId: v.string(),
        fileName: v.string(),
        fileType: v.string(),
        fileSize: v.number(),
        uploadedAt: v.number(),
        userId: v.id("users"),
    })
        .index("by_userId", ["userId"])
        .index("by_fileId", ["fileId"])
        .index("by_uploadedAt", ["uploadedAt"]),
};

const schema = defineSchema({
    ...ai,
    ...authTables,
    ...chatTables,
    ...subscriptionTables,
    ...emailTables,
    ...filesTables,
});

export default schema;
