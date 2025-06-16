import { ConvexError, v } from "convex/values";
import { components, internal } from "../_generated/api";
import { mutation, action, query } from "../_generated/server";
import { R2 } from "@convex-dev/r2";
import { checkRateLimit, getRateLimitName } from "../lib/rateLimiter";

// Initialize R2 client
const r2 = new R2(components.r2);

// R2 client API with proper callbacks for the useUploadFile hook
export const { generateUploadUrl, syncMetadata } = r2.clientApi({
    checkUpload: async (ctx, bucket) => {
        // Get the current user from the session
        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.tokenIdentifier) {
            throw new ConvexError("Unauthorized - no session token");
        }

        const sessionData = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: identity.tokenIdentifier,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized - invalid session");
        }

        // Rate limit file uploads
        const rateLimitResult = await checkRateLimit(ctx, getRateLimitName("chatMessage", true), {
            key: sessionData.userId,
            count: 1,
        });

        if (!rateLimitResult.ok) {
            throw new ConvexError("Rate limit exceeded for file uploads");
        }

        // Validation passed - return void as expected by the callback
    },
    onUpload: async (ctx, key) => {
        // This runs after the file is uploaded to R2 but before metadata sync
        // We can create relations or perform additional processing here
        console.log(`File uploaded to R2 with key: ${key}`);

        // You could store additional metadata or create relationships here
        // For example, associate the file with a user or thread
    },
});

// Generate R2 upload URL with custom key (for manual uploads)
export const generateR2UploadUrl = mutation({
    args: {
        sessionToken: v.string(),
        filename: v.string(),
    },
    returns: v.object({
        uploadUrl: v.string(),
        key: v.string(),
    }),
    handler: async (ctx, args) => {
        const sessionData: any = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        // Rate limit file uploads
        const rateLimitResult = await checkRateLimit(ctx, getRateLimitName("chatMessage", true), {
            key: sessionData.userId,
            count: 1,
        });

        if (!rateLimitResult.ok) {
            throw new ConvexError("Rate limit exceeded for file uploads");
        }

        // Generate a custom key with user ID and timestamp
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileExtension = args.filename.split(".").pop() || "";
        const customKey = `uploads/${sessionData.userId}/${timestamp}-${randomId}${fileExtension ? "." + fileExtension : ""}`;

        // Generate actual R2 upload URL with custom key
        const result = await r2.generateUploadUrl(customKey);

        return {
            uploadUrl: result.url,
            key: customKey,
        };
    },
});

// Store file from URL directly in R2
export const storeFileFromUrl = action({
    args: {
        url: v.string(),
        filename: v.optional(v.string()),
        mimeType: v.optional(v.string()),
        sessionToken: v.string(),
    },
    returns: v.object({
        key: v.string(),
        url: v.string(),
    }),
    handler: async (ctx, args) => {
        const sessionData: any = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        // Download the file from the URL
        const response = await fetch(args.url);
        if (!response.ok) {
            throw new ConvexError(`Failed to fetch file: ${response.statusText}`);
        }

        const blob = await response.blob();

        // Generate a custom key
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileExtension = args.filename?.split(".").pop() || "";
        const customKey = `uploads/${sessionData.userId}/${timestamp}-${randomId}${fileExtension ? "." + fileExtension : ""}`;

        // Store directly in R2 with custom key and metadata sync
        const key = await r2.store(ctx, blob, {
            key: customKey,
            type: args.mimeType || blob.type,
        });

        // Get the URL for the stored file
        const fileUrl = await r2.getUrl(key);

        return {
            key,
            url: fileUrl,
        };
    },
});

// Get file URL from R2
export const getR2FileUrl = query({
    args: {
        key: v.string(),
        sessionToken: v.string(),
        expiresIn: v.optional(v.number()),
    },
    returns: v.string(),
    handler: async (ctx, args) => {
        const sessionData: any = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new ConvexError("Unauthorized");
        }

        // Get URL with optional expiration from R2
        const url = await r2.getUrl(args.key, {
            expiresIn: args.expiresIn || 900, // Default 15 minutes
        });

        return url;
    },
});

// Sync metadata callback for R2 uploads
export const onSyncMetadata = mutation({
    args: {
        bucket: v.string(),
        key: v.string(),
        isNew: v.boolean(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        // This is called by the R2 component after file upload
        console.log(`Syncing metadata for R2 file: ${args.key}, isNew: ${args.isNew}`);

        // You could store file metadata in your database here
        // For example, create a files table entry or update existing records

        return null;
    },
});

// Helper function to check if user owns a file
export const checkFileOwnership = query({
    args: {
        key: v.string(),
        sessionToken: v.string(),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const sessionData: any = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            return false;
        }

        // Check if the file key starts with the user's upload path
        return args.key.startsWith(`uploads/${sessionData.userId}/`);
    },
});
