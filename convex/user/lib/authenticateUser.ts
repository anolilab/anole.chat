import { internal } from "@cvx/_generated/api";
import { ConvexError } from "convex/values";
import { Id } from "@cvx/_generated/dataModel";

export async function authenticateUser(ctx: any, sessionToken: string): Promise<{ id: Id<"user"> }> {
    const sessionData: any = await ctx.runQuery(internal.betterAuth.getSession, {
        sessionToken,
    });

    if (!sessionData) {
        throw new ConvexError("Unauthorized");
    }

    return { id: sessionData.userId as Id<"user"> };
}
