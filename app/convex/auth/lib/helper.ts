import { QueryCtx } from "../../_generated/server";
import { betterAuthComponent } from "@cvx/auth";

/**
 * Get the current user's ID from the Better Auth context.
 * Throws an error if no user is authenticated.
 */
export const requireUserId = async (ctx: QueryCtx): Promise<string> => {
    const userId = await betterAuthComponent.getAuthUserId(ctx);

    if (!userId) {
        throw new Error("Authentication required");
    }

    return userId;
};
