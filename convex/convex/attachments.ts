import { storeFile } from "@convex-dev/agent";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { action, mutation, query } from "./_generated/server";
import { requireUserId } from "./auth/lib/helper";

// Store file using the agent file storage
export const uploadFile = action({
    args: {
        bytes: v.bytes(),
        filename: v.string(),
        mimeType: v.string(),
        sha256: v.optional(v.string()),
    },
    handler: async (context, arguments_) => {
        const userId = await requireUserId(context);

        const {
            file: { fileId, url },
        } = await storeFile(context, components.agent, new Blob([arguments_.bytes], { type: arguments_.mimeType }), arguments_.filename, arguments_.sha256);

        // Store file metadata in the database
        const fileRecord = await context.db.insert("files", {
            fileId,
            fileName: arguments_.filename,
            fileType: arguments_.mimeType,
            fileSize: arguments_.bytes.length,
            uploadedAt: Date.now(),
            userId: userId,
        });

        return {
            fileId,
            url,
            fileName: arguments_.filename,
            fileType: arguments_.mimeType,
            fileSize: arguments_.bytes.length,
            uploadedAt: Date.now(),
            success: true
        };
    },
});

// List files for current user
export const listFiles = query({
    args: {
        limit: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        try {
            const userId = await requireUserId(ctx);

            const files = await ctx.db
                .query("files")
                .withIndex("by_userId", (q) => q.eq("userId", userId))
                .order("desc")
                .take(args.limit || 50);

            return files.map(file => ({
                key: file.fileId,
                fileName: file.fileName,
                type: file.fileType,
                size: file.fileSize,
                uploadedAt: file.uploadedAt,
            }));
        } catch (error) {
            console.error("Error listing files:", error);
            return [];
        }
    }
});

// Delete file
export const deleteFile = mutation({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        try {
            const userId = await requireUserId(ctx);

            // Find the file record
            const fileRecord = await ctx.db
                .query("files")
                .withIndex("by_fileId", (q) => q.eq("fileId", args.key))
                .unique();

            if (!fileRecord) {
                return {
                    success: false,
                    error: "File not found"
                };
            }

            if (fileRecord.userId !== userId) {
                return {
                    success: false,
                    error: "Access denied: File does not belong to user"
                };
            }

            // Delete from agent storage
            await internal.agent.files.deleteFiles({ fileIds: [args.key] });

            // Delete from database
            await ctx.db.delete(fileRecord._id);

            return { success: true };
        } catch (error) {
            console.error("Error deleting file:", error);
            return {
                success: false,
                error: `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`
            };
        }
    }
});

// Get file metadata
export const getFileMetadata = query({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        try {
            const fileRecord = await ctx.db
                .query("files")
                .withIndex("by_fileId", (q) => q.eq("fileId", args.key))
                .unique();

            return fileRecord;
        } catch (error) {
            console.error("Error getting file metadata:", error);
            return null;
        }
    }
});