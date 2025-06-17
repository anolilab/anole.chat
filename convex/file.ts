import { storeFile } from "@convex-dev/agent";
import { components, internal } from "./_generated/api";
import { action } from "./_generated/server";
import { v } from "convex/values";

export const uploadFile = action({
    args: {
        filename: v.string(),
        mimeType: v.string(),
        bytes: v.bytes(),
        sha256: v.optional(v.string()),
        sessionToken: v.string(),
    },
    handler: async (ctx, args) => {
        const sessionData: any | null = await ctx.runQuery(internal.betterAuth.getSession, {
            sessionToken: args.sessionToken,
        });

        if (!sessionData) {
            throw new Error("Unauthorized");
        }

        const {
            file: { fileId, url },
        } = await storeFile(ctx, components.agent, new Blob([args.bytes], { type: args.mimeType }), args.filename, args.sha256);
        return { fileId, url };
    },
});
