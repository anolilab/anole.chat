import { storeFile } from "@convex-dev/agent";
import { components, internal } from "./_generated/api";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./auth/lib/helper";

export const uploadFile = action({
    args: {
        filename: v.string(),
        mimeType: v.string(),
        bytes: v.bytes(),
        sha256: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireUserId(ctx);

        const {
            file: { fileId, url },
        } = await storeFile(ctx, components.agent, new Blob([args.bytes], { type: args.mimeType }), args.filename, args.sha256);
        return { fileId, url };
    },
});
