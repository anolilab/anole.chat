import { defineTable } from "convex/server";
import { v } from "convex/values";

export const filesTables = {
    // File metadata and storage information
    files: defineTable({
        // File identification
        storageId: v.id("_storage"), // Convex storage ID
        r2Key: v.optional(v.string()), // R2 object key for external storage

        // File metadata
        name: v.string(), // Original filename
        contentType: v.string(), // MIME type
        size: v.number(), // File size in bytes

        // File categorization
        type: v.union(
            v.literal("image"),
            v.literal("document"),
            v.literal("video"),
            v.literal("audio"),
            v.literal("archive"),
            v.literal("code"),
            v.literal("other"),
        ),

        // Upload information
        uploadedBy: v.id("user"), // User who uploaded the file
        uploadedAt: v.number(), // Upload timestamp

        // Processing status
        status: v.union(v.literal("uploading"), v.literal("processing"), v.literal("ready"), v.literal("error")),

        // Optional metadata
        metadata: v.optional(
            v.object({
                width: v.optional(v.number()), // For images/videos
                height: v.optional(v.number()), // For images/videos
                duration: v.optional(v.number()), // For audio/video
                pages: v.optional(v.number()), // For documents
                encoding: v.optional(v.string()), // For text files
            }),
        ),

        // Error information
        error: v.optional(v.string()),
    })
        .index("by_user", ["uploadedBy"])
        .index("by_type", ["type"])
        .index("by_status", ["status"])
        .index("by_upload_date", ["uploadedAt"])
        .index("by_r2_key", ["r2Key"]),

    // Link files to messages
    messageFiles: defineTable({
        messageId: v.string(), // Agent message ID
        fileId: v.id("files"), // Reference to the file
        threadId: v.string(), // Thread the message belongs to
        attachedAt: v.number(), // When the file was attached
        order: v.optional(v.number()), // Order of attachment in the message
    })
        .index("by_message", ["messageId"])
        .index("by_file", ["fileId"])
        .index("by_thread", ["threadId"])
        .index("by_message_and_order", ["messageId", "order"]),

    // File access logs for analytics and security
    fileAccess: defineTable({
        fileId: v.id("files"),
        userId: v.optional(v.id("user")), // User who accessed (null for anonymous)
        accessType: v.union(v.literal("view"), v.literal("download"), v.literal("preview")),
        accessedAt: v.number(),
        userAgent: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
    })
        .index("by_file", ["fileId"])
        .index("by_user", ["userId"])
        .index("by_access_date", ["accessedAt"]),
};
