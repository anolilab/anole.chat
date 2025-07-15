import { storeFile } from "@convex-dev/agent";
import { v } from "convex/values";

import { components, internal } from "./_generated/api";
import { action } from "./_generated/server";
import { requireUserId } from "./auth/lib/helper";

export const uploadFile = action({
    args: {
        bytes: v.bytes(),
        filename: v.string(),
        mimeType: v.string(),
        sha256: v.optional(v.string()),
    },
    handler: async (context, arguments_) => {
        await requireUserId(context);

        const {
            file: { fileId, url },
        } = await storeFile(
            context,
            components.agent,
            new Blob([arguments_.bytes], { type: arguments_.mimeType }),
            arguments_.filename,
            arguments_.sha256,
        );

        return { fileId, url };
    },
});
