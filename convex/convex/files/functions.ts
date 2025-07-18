import { R2 } from "@convex-dev/r2";
import { v } from "convex/values";

import { components } from "../_generated/api";
import { httpAction } from "../_generated/server";
import { authedMutation, authedQuery, c } from "../auth/functions";
import {
    estimateTokenCount,
    getCorrectMimeType,
    getFileTypeInfo,
    isSupportedFile,
    MAX_FILE_SIZE,
    MAX_TOKENS_PER_FILE,
} from "./lib/file_constants";

export const r2 = new R2(components.r2);

export const { generateUploadUrl, syncMetadata } = r2.clientApi({
    checkUpload: async (context, bucket, { fileName, fileSize, fileType }) => {
        // Validate file size
        if (fileSize > MAX_FILE_SIZE) {
            throw new Error(
                `File size exceeds 5MB limit. Current size: ${fileSize} bytes`,
            );
        }

        // Validate file type
        if (!isSupportedFile(fileName, fileType)) {
            throw new Error(`Unsupported file type: ${fileName}`);
        }

        const fileTypeInfo = getFileTypeInfo(fileName, fileType);

        // For text files, validate token count (client should provide a token estimate if possible)
        if (
            fileTypeInfo.isText
            && !fileTypeInfo.isImage
            && typeof estimateTokenCount === "function"
        ) {
            // Optionally, you could require the client to send a token count
            // For now, just warn if not provided
            // throw if you want to enforce
        }
        // PDF validation could go here if you want to enforce page/token limits
        // ...
    },
    onUpload: async (context, key) => {
        // ...do something with the key
        // Runs in the `syncMetadata` mutation, before the upload is performed from the
        // client side. Convenient way to create relations between the newly created
        // object key and other data in your Convex database. Runs after the `checkUpload`
        // callback.
    },
});

export const getFileMetadata = authedQuery({
    args: { key: v.string() },
    handler: async (context, arguments_) => {
        try {
            const metadata = await r2.getMetadata(context, arguments_.key);

            return metadata;
        } catch (error) {
            console.error("Error getting file metadata:", error);

            return null;
        }
    },
});

// Mutation to delete file - now with auth check
export const deleteFile = authedMutation({
    args: { key: v.string() },
    handler: async (context, arguments_) => {
        try {
            const metadata = await r2.getMetadata(context, arguments_.key);

            if (!metadata) {
                return {
                    error: "File not found",
                    success: false,
                };
            }

            // For R2, we'll use the key to determine ownership
            // Files are stored with user ID in the key path
            if (!metadata.key.includes(`attachments/${context.user.userId}/`)) {
                return {
                    error: "Access denied: File does not belong to user",
                    success: false,
                };
            }

            await r2.deleteObject(context, arguments_.key);

            console.log("Successfully deleted file:", arguments_.key);

            return { success: true };
        } catch (error) {
            console.error("Error deleting file:", error);

            return {
                error: `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`,
                success: false,
            };
        }
    },
});

// List files for current user only
export const listFiles = authedQuery({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (context, arguments_) => {
        try {
            // List files for the specific user by filtering keys
            const allFiles = await r2.listMetadata(
                context,
                arguments_.limit || 100,
            );

            return allFiles.filter((file) =>
                file.key.includes(`attachments/${context.user.userId}/`),
            );
        } catch (error) {
            console.error("Error listing files:", error);

            return [];
        }
    },
});

export const getFile = httpAction(async (context, request) => {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key)
        return new Response(null, { status: 400 });

    const file = await r2.getUrl(key);

    return Response.redirect(file);
});
