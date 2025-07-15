import type { Id } from "../../_generated/dataModel";
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
): Promise<Id<"users">> => {
    const userId = await betterAuthComponent.getAuthUserId(context);

    if (!userId) {
        throw new Error("Authentication required");
    }

    return userId as Id<"users">;
};

export const getCurrentUserInternal = async (context: QueryContext) => {
    const userMetadata = await betterAuthComponent.getAuthUser(context);

    if (!userMetadata) {
        return null;
    }

    // Get user data from your application's database (skip this if you have no
    // fields in your users table schema)
    const user = await context.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", userMetadata.userId))
        .unique();

    return {
        ...userMetadata,
        ...user,
    };
};
