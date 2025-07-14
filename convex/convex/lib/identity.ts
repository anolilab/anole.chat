import type { QueryCtx, ActionCtx } from "../_generated/server";
import { betterAuthComponent } from "../auth";

interface UserIdentity {
    id: string;
    email: string;
    name?: string;
}

interface IdentityError {
    error: string;
}

export async function getUserIdentity(
    context: QueryCtx | ActionCtx,
    options: { allowAnons: boolean } = { allowAnons: false }
): Promise<UserIdentity | IdentityError> {
    try {
        const userMetadata = await betterAuthComponent.getAuthUser(context);

        if (!userMetadata) {
            if (options.allowAnons) {
                return {
                    id: "anonymous",
                    email: "anonymous@example.com",
                    name: "Anonymous User"
                };
            }
            return { error: "User not authenticated" };
        }

        return {
            id: userMetadata.userId,
            email: userMetadata.email || "",
            name: userMetadata.name || userMetadata.email || "Unknown User"
        };
    } catch (error) {
        console.error("Error getting user identity:", error);
        return { error: "Failed to get user identity" };
    }
}