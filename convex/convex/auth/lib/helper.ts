import type {
    ActionCtx as ActionContext,
    QueryCtx as QueryContext,
} from "../../_generated/server";
import { betterAuthComponent } from "../../auth";

/**
 * Get the current user's ID from the Better Auth context.
 * Throws an error if no user is authenticated.
 */
export const requireUserId = async (
    context: QueryContext | ActionContext,
): Promise<string> => {
    const userId = await betterAuthComponent.getAuthUserId(context);

    if (!userId) {
        throw new Error("Authentication required");
    }

    return userId;
};

export const getCurrentUserInternal = async (context: QueryContext) => {
    const user = await betterAuthComponent.getAuthUser(context);

    if (!user) {
        return null;
    }

    return user;
};
