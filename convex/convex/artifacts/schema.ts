import { defineTable } from "convex/server";
import { v } from "convex/values";

const artifactsTables = {
    documents: defineTable({
        content: v.string(),
        kind: v.union(
            v.literal("text"),
            v.literal("code"),
            v.literal("sheet")
        ),
        messageId: v.optional(v.string()),
        title: v.string(),
        userId: v.id("users"),
    })
        .index("by_user", ["userId"])
        .index("by_kind", ["kind"])
        .index("by_user_and_kind", ["userId", "kind"])
        .index("by_message", ["messageId"]),

    documentVersions: defineTable({
        content: v.string(),
        documentId: v.id("documents"),
        messageId: v.optional(v.string()),
        version: v.number(),
    })
        .index("by_document", ["documentId"])
        .index("by_document_and_version", ["documentId", "version"]),

    suggestions: defineTable({
        content: v.string(),
        documentId: v.id("documents"),
        messageId: v.optional(v.string()),
        type: v.union(
            v.literal("improvement"),
            v.literal("correction"),
            v.literal("enhancement")
        ),
    })
        .index("by_document", ["documentId"])
        .index("by_type", ["type"]),
};

export default artifactsTables;