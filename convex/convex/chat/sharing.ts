import { ConvexError, v } from "convex/values";

import { components, internal } from "../_generated/api";
import { internalQuery } from "../_generated/server";
import { authedMutation, authedQuery } from "../auth/functions";

// Helper function to generate unique tokens
function generateToken(): string {
    // TODO: use a function
    return "3d687s5ad68asdsa";
}

// Helper function to calculate expiration time
function calculateExpirationTime(
    expirationType: "1_day" | "7_days" | "custom",
    customHours?: number,
): number {
    const now = Date.now();

    switch (expirationType) {
        case "1_day": {
            return now + 24 * 60 * 60 * 1000;
        }
        case "7_days": {
            return now + 7 * 24 * 60 * 60 * 1000;
        }
        case "custom": {
            if (!customHours || customHours <= 0) {
                throw new ConvexError("Custom hours must be greater than 0");
            }

            return now + customHours * 60 * 60 * 1000;
        }
        default: {
            throw new ConvexError("Invalid expiration type");
        }
    }
}

// Check if user has access to a thread
export const checkThreadAccess = internalQuery({
    args: {
        requiredPermission: v.optional(
            v.union(v.literal("read"), v.literal("write"), v.literal("admin")),
        ),
        threadId: v.string(),
        userId: v.id("user"),
    },
    handler: async (
        context,
        { requiredPermission = "read", threadId, userId },
    ) => {
        // Check if user is the thread owner
        const thread = await context.runQuery(
            components.agent.threads.getThread,
            { threadId },
        );

        if (thread && thread.userId === userId) {
            return true; // Owner has all permissions
        }

        // Check thread visibility in unified threads table
        const threadRecord = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();

        if (threadRecord && threadRecord.isPublic) {
            return true; // Public threads are readable by everyone
        }

        // Check explicit access permissions
        const access = await context.db
            .query("threadAccess")
            .withIndex("by_thread_and_user", (q) =>
                q.eq("threadId", threadId).eq("userId", userId))
            .unique();

        if (!access) {
            return false;
        }

        // Check if access has expired
        if (access.expiresAt && access.expiresAt < Date.now()) {
            return false;
        }

        // Check permission level
        const permissionLevels: Record<string, number> = {
            admin: 3,
            read: 1,
            write: 2,
        };
        const requiredLevel = permissionLevels[requiredPermission];
        const userLevel = permissionLevels[access.permission];

        return userLevel >= requiredLevel;
    },
    returns: v.boolean(),
});

// Get thread access information
export const getThreadAccess = authedQuery({
    args: {
        threadId: v.string(),
    },
    handler: async (context, { threadId }) => {
        const { userId } = context.user;

        // Check if user has access to this thread
        const hasAccess = await context.runQuery(
            internal.chat.sharing.checkThreadAccess,
            {
                requiredPermission: "read",
                threadId,
                userId,
            },
        );

        if (!hasAccess) {
            throw new ConvexError("Access denied");
        }

        // Get thread info to check ownership and visibility
        const thread = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();
        const isOwner = thread?.userId === userId;

        // Get all users with access to this thread
        const accessList = await context.db
            .query("threadAccess")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .collect();

        // Get user details for each access entry
        const users = await Promise.all(
            accessList.map(async (access) => {
                const user = await context.db.get(access.userId);

                return {
                    email: user?.email || "",
                    expiresAt: access.expiresAt,
                    grantedAt: access.grantedAt,
                    name:
                        typeof user?.name === "string" ? user.name : undefined,
                    permission: access.permission,
                    userId: access.userId,
                };
            }),
        );

        return {
            isOwner,
            isPublic: thread?.isPublic || false,
            permission: isOwner
                ? "admin"
                : accessList.find((a) => a.userId === userId)?.permission
                    || "read",
            publicAccessToken: thread?.publicAccessToken,
            users,
        };
    },
    returns: v.object({
        isOwner: v.boolean(),
        isPublic: v.boolean(),
        permission: v.union(
            v.literal("read"),
            v.literal("write"),
            v.literal("admin"),
        ),
        publicAccessToken: v.optional(v.string()),
        users: v.array(
            v.object({
                email: v.string(),
                expiresAt: v.optional(v.number()),
                grantedAt: v.number(),
                name: v.optional(v.string()),
                permission: v.union(
                    v.literal("read"),
                    v.literal("write"),
                    v.literal("admin"),
                ),
                userId: v.id("user"),
            }),
        ),
    }),
});

// Create an invite for a thread
export const createThreadInvite = authedMutation({
    args: {
        customHours: v.optional(v.number()),
        expirationType: v.union(
            v.literal("1_day"),
            v.literal("7_days"),
            v.literal("custom"),
        ),
        invitedEmail: v.string(),
        permission: v.union(
            v.literal("read"),
            v.literal("write"),
            v.literal("admin"),
        ),
        threadId: v.string(),
    },
    handler: async (
        context,
        { customHours, expirationType, invitedEmail, permission, threadId },
    ) => {
        const { userId } = context.user;

        // Check if user has admin access to this thread
        const hasAccess = await context.runQuery(
            internal.chat.sharing.checkThreadAccess,
            {
                requiredPermission: "admin",
                threadId,
                userId,
            },
        );

        if (!hasAccess) {
            throw new ConvexError("Admin access required to create invites");
        }

        // Check if invite already exists for this email and thread
        const existingInvite = await context.db
            .query("threadInvites")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .filter((q) => q.eq(q.field("invitedEmail"), invitedEmail))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .unique();

        if (existingInvite) {
            throw new ConvexError("An invite already exists for this email");
        }

        const inviteToken = generateToken();
        const expiresAt = calculateExpirationTime(expirationType, customHours);

        await context.db.insert("threadInvites", {
            expiresAt,
            invitedBy: userId,
            invitedEmail,
            inviteToken,
            permission,
            status: "pending",
            threadId,
        });

        return {
            expiresAt,
            inviteToken,
        };
    },
    returns: v.object({
        expiresAt: v.number(),
        inviteToken: v.string(),
    }),
});

// Get pending invites for a thread
export const getThreadInvites = authedQuery({
    args: {
        threadId: v.string(),
    },
    handler: async (context, { threadId }) => {
        const { userId } = context.user;

        // Check if user has admin access to this thread
        const hasAccess = await context.runQuery(
            internal.chat.sharing.checkThreadAccess,
            {
                requiredPermission: "admin",
                threadId,
                userId,
            },
        );

        if (!hasAccess) {
            throw new ConvexError("Admin access required to view invites");
        }

        const invites = await context.db
            .query("threadInvites")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .collect();

        return invites.map((invite) => {
            return {
                _id: invite._id,
                expiresAt: invite.expiresAt,
                invitedAt: invite._creationTime,
                invitedEmail: invite.invitedEmail,
                inviteToken: invite.inviteToken,
                permission: invite.permission,
                status: invite.status,
            };
        });
    },
    returns: v.array(
        v.object({
            _id: v.id("threadInvites"),
            expiresAt: v.number(),
            invitedAt: v.number(),
            invitedEmail: v.string(),
            inviteToken: v.string(),
            permission: v.union(
                v.literal("read"),
                v.literal("write"),
                v.literal("admin"),
            ),
            status: v.union(
                v.literal("pending"),
                v.literal("accepted"),
                v.literal("expired"),
                v.literal("revoked"),
            ),
        }),
    ),
});

// Revoke an invite
export const revokeThreadInvite = authedMutation({
    args: {
        inviteId: v.id("threadInvites"),
    },
    handler: async (context, { inviteId }) => {
        const { userId } = context.user;

        const invite = await context.db.get(inviteId);

        if (!invite) {
            throw new ConvexError("Invite not found");
        }

        // Check if user has admin access to this thread
        const hasAccess = await context.runQuery(
            internal.chat.sharing.checkThreadAccess,
            {
                requiredPermission: "admin",
                threadId: invite.threadId,
                userId,
            },
        );

        if (!hasAccess) {
            throw new ConvexError("Admin access required to revoke invites");
        }

        await context.db.patch(inviteId, { status: "revoked" });

        return null;
    },
    returns: v.null(),
});

// Accept an invite
export const acceptThreadInvite = authedMutation({
    args: {
        inviteToken: v.string(),
    },
    handler: async (context, { inviteToken }) => {
        const { userId } = context.user;

        const invite = await context.db
            .query("threadInvites")
            .withIndex("by_invite_token", (q) =>
                q.eq("inviteToken", inviteToken))
            .unique();

        if (!invite) {
            throw new ConvexError("Invalid invite token");
        }

        if (invite.status !== "pending") {
            throw new ConvexError("Invite is no longer valid");
        }

        if (invite.expiresAt < Date.now()) {
            await context.db.patch(invite._id, { status: "expired" });
            throw new ConvexError("Invite has expired");
        }

        // Check if user already has access
        const existingAccess = await context.db
            .query("threadAccess")
            .withIndex("by_thread_and_user", (q) =>
                q.eq("threadId", invite.threadId).eq("userId", userId))
            .unique();

        if (existingAccess) {
            // Update existing access with new permission
            await context.db.patch(existingAccess._id, {
                grantedAt: Date.now(),
                grantedBy: invite.invitedBy,
                permission: invite.permission,
            });
        } else {
            // Create new access
            await context.db.insert("threadAccess", {
                grantedAt: Date.now(),
                grantedBy: invite.invitedBy,
                permission: invite.permission,
                threadId: invite.threadId,
                userId,
            });
        }

        // Mark invite as accepted
        await context.db.patch(invite._id, {
            acceptedAt: Date.now(),
            acceptedBy: userId,
            status: "accepted",
        });

        return {
            permission: invite.permission,
            threadId: invite.threadId,
        };
    },
    returns: v.object({
        permission: v.union(
            v.literal("read"),
            v.literal("write"),
            v.literal("admin"),
        ),
        threadId: v.string(),
    }),
});

// Remove user access from thread
export const removeThreadAccess = authedMutation({
    args: {
        targetUserId: v.id("user"),
        threadId: v.string(),
    },
    handler: async (context, { targetUserId, threadId }) => {
        const { userId } = context.user;

        // Check if user has admin access to this thread
        const hasAccess = await context.runQuery(
            internal.chat.sharing.checkThreadAccess,
            {
                requiredPermission: "admin",
                threadId,
                userId,
            },
        );

        if (!hasAccess) {
            throw new ConvexError("Admin access required to remove users");
        }

        // Don't allow removing the thread owner
        const thread = await context.runQuery(
            components.agent.threads.getThread,
            { threadId },
        );

        if (thread?.userId === targetUserId) {
            throw new ConvexError("Cannot remove thread owner");
        }

        const access = await context.db
            .query("threadAccess")
            .withIndex("by_thread_and_user", (q) =>
                q.eq("threadId", threadId).eq("userId", targetUserId))
            .unique();

        if (access) {
            await context.db.delete(access._id);
        }

        return null;
    },
    returns: v.null(),
});

// Toggle thread public visibility
export const toggleThreadVisibility = authedMutation({
    args: {
        isPublic: v.boolean(),
        threadId: v.string(),
    },
    handler: async (context, { isPublic, threadId }) => {
        const { userId } = context.user;

        // Check if user has admin access to this thread
        const hasAccess = await context.runQuery(
            internal.chat.sharing.checkThreadAccess,
            {
                requiredPermission: "admin",
                threadId,
                userId,
            },
        );

        if (!hasAccess) {
            throw new ConvexError(
                "Admin access required to change thread visibility",
            );
        }

        const thread = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();

        if (!thread)
            throw new ConvexError("Thread not found");

        const newToken = isPublic ? generateToken() : undefined;

        await context.db.patch(thread._id, {
            isPublic,
            publicAccessToken: newToken,
            updatedAt: Date.now(),
        });

        return {
            isPublic,
            publicAccessToken: newToken,
        };
    },
    returns: v.object({
        isPublic: v.boolean(),
        publicAccessToken: v.optional(v.string()),
    }),
});

// Get public thread by access token
export const getPublicThread = authedQuery({
    args: {
        publicAccessToken: v.string(),
    },
    handler: async (context, { publicAccessToken }) => {
        const thread = await context.db
            .query("threads")
            .withIndex("by_thread", (q) => q)
            .filter((q) =>
                q.eq(q.field("publicAccessToken"), publicAccessToken),
            )
            .unique();

        if (!thread || !thread.isPublic) {
            return null;
        }

        return {
            isPublic: true,
            threadId: thread.threadId,
            title: typeof thread.title === "string" ? thread.title : undefined,
        };
    },
    returns: v.union(
        v.object({
            isPublic: v.boolean(),
            threadId: v.string(),
            title: v.optional(v.string()),
        }),
        v.null(),
    ),
});
