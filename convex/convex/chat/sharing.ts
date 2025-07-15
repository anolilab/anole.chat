import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { authedMutation, authedQuery, authedAction } from "../auth/functions";
import { internal } from "../_generated/api";
import { internalMutation, internalQuery, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { randomBytes } from "crypto";

// Helper function to generate unique tokens
function generateToken(): string {
    return randomBytes(32).toString('hex');
}

// Helper function to calculate expiration time
function calculateExpirationTime(expirationType: "1_day" | "7_days" | "custom", customHours?: number): number {
    const now = Date.now();
    switch (expirationType) {
        case "1_day":
            return now + (24 * 60 * 60 * 1000);
        case "7_days":
            return now + (7 * 24 * 60 * 60 * 1000);
        case "custom":
            if (!customHours || customHours <= 0) {
                throw new ConvexError("Custom hours must be greater than 0");
            }
            return now + (customHours * 60 * 60 * 1000);
        default:
            throw new ConvexError("Invalid expiration type");
    }
}

// Check if user has access to a thread
export const checkThreadAccess = internalQuery({
    args: {
        threadId: v.string(),
        userId: v.id("users"),
        requiredPermission: v.optional(v.union(v.literal("read"), v.literal("write"), v.literal("admin"))),
    },
    returns: v.boolean(),
    handler: async (ctx, { threadId, userId, requiredPermission = "read" }) => {
        // Check if user is the thread owner
        const thread = await ctx.runQuery(internal.chat.functions.getThread, { threadId });
        if (thread && thread.userId === userId) {
            return true; // Owner has all permissions
        }

        // Check thread visibility
        const visibility = await ctx.db
            .query("threadVisibility")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();

        if (visibility?.isPublic) {
            return true; // Public threads are readable by everyone
        }

        // Check explicit access permissions
        const access = await ctx.db
            .query("threadAccess")
            .withIndex("by_thread_and_user", (q) =>
                q.eq("threadId", threadId).eq("userId", userId)
            )
            .unique();

        if (!access) {
            return false;
        }

        // Check if access has expired
        if (access.expiresAt && access.expiresAt < Date.now()) {
            return false;
        }

        // Check permission level
        const permissionLevels: Record<string, number> = { read: 1, write: 2, admin: 3 };
        const requiredLevel = permissionLevels[requiredPermission];
        const userLevel = permissionLevels[access.permission];

        return userLevel >= requiredLevel;
    },
});

// Get thread access information
export const getThreadAccess = authedQuery({
    args: {
        threadId: v.string(),
    },
    returns: v.object({
        isOwner: v.boolean(),
        permission: v.union(v.literal("read"), v.literal("write"), v.literal("admin")),
        users: v.array(v.object({
            userId: v.id("users"),
            email: v.string(),
            name: v.optional(v.string()),
            permission: v.union(v.literal("read"), v.literal("write"), v.literal("admin")),
            grantedAt: v.number(),
            expiresAt: v.optional(v.number()),
        })),
        isPublic: v.boolean(),
        publicAccessToken: v.optional(v.string()),
    }),
    handler: async (ctx, { threadId }) => {
        const userId = ctx.user._id;

        // Check if user has access to this thread
        const hasAccess = await ctx.runQuery(internal.chat.sharing.checkThreadAccess, {
            threadId,
            userId,
            requiredPermission: "read",
        });

        if (!hasAccess) {
            throw new ConvexError("Access denied");
        }

        // Get thread info to check ownership
        const thread = await ctx.runQuery(internal.chat.functions.getThread, { threadId });
        const isOwner = thread?.userId === userId;

        // Get thread visibility
        const visibility = await ctx.db
            .query("threadVisibility")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();

        // Get all users with access to this thread
        const accessList = await ctx.db
            .query("threadAccess")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .collect();

        // Get user details for each access entry
        const users = await Promise.all(
            accessList.map(async (access) => {
                const user = await ctx.db.get(access.userId);
                return {
                    userId: access.userId,
                    email: user?.email || "",
                    name: user?.name,
                    permission: access.permission,
                    grantedAt: access.grantedAt,
                    expiresAt: access.expiresAt,
                };
            })
        );

        return {
            isOwner,
            permission: isOwner ? "admin" : accessList.find(a => a.userId === userId)?.permission || "read",
            users,
            isPublic: visibility?.isPublic || false,
            publicAccessToken: visibility?.publicAccessToken,
        };
    },
});

// Create an invite for a thread
export const createThreadInvite = authedMutation({
    args: {
        threadId: v.string(),
        invitedEmail: v.string(),
        permission: v.union(v.literal("read"), v.literal("write"), v.literal("admin")),
        expirationType: v.union(v.literal("1_day"), v.literal("7_days"), v.literal("custom")),
        customHours: v.optional(v.number()),
    },
    returns: v.object({
        inviteToken: v.string(),
        expiresAt: v.number(),
    }),
    handler: async (ctx, { threadId, invitedEmail, permission, expirationType, customHours }) => {
        const userId = ctx.user._id;

        // Check if user has admin access to this thread
        const hasAccess = await ctx.runQuery(internal.chat.sharing.checkThreadAccess, {
            threadId,
            userId,
            requiredPermission: "admin",
        });

        if (!hasAccess) {
            throw new ConvexError("Admin access required to create invites");
        }

        // Check if invite already exists for this email and thread
        const existingInvite = await ctx.db
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

        await ctx.db.insert("threadInvites", {
            threadId,
            invitedEmail,
            invitedBy: userId,
            permission,
            inviteToken,
            expiresAt,
            status: "pending",
        });

        return {
            inviteToken,
            expiresAt,
        };
    },
});

// Get pending invites for a thread
export const getThreadInvites = authedQuery({
    args: {
        threadId: v.string(),
    },
    returns: v.array(v.object({
        _id: v.id("threadInvites"),
        invitedEmail: v.string(),
        permission: v.union(v.literal("read"), v.literal("write"), v.literal("admin")),
        inviteToken: v.string(),
        expiresAt: v.number(),
        status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired"), v.literal("revoked")),
        invitedAt: v.number(),
    })),
    handler: async (ctx, { threadId }) => {
        const userId = ctx.user._id;

        // Check if user has admin access to this thread
        const hasAccess = await ctx.runQuery(internal.chat.sharing.checkThreadAccess, {
            threadId,
            userId,
            requiredPermission: "admin",
        });

        if (!hasAccess) {
            throw new ConvexError("Admin access required to view invites");
        }

        const invites = await ctx.db
            .query("threadInvites")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .collect();

        return invites.map(invite => ({
            _id: invite._id,
            invitedEmail: invite.invitedEmail,
            permission: invite.permission,
            inviteToken: invite.inviteToken,
            expiresAt: invite.expiresAt,
            status: invite.status,
            invitedAt: invite._creationTime,
        }));
    },
});

// Revoke an invite
export const revokeThreadInvite = authedMutation({
    args: {
        inviteId: v.id("threadInvites"),
    },
    returns: v.null(),
    handler: async (ctx, { inviteId }) => {
        const userId = ctx.user._id;

        const invite = await ctx.db.get(inviteId);
        if (!invite) {
            throw new ConvexError("Invite not found");
        }

        // Check if user has admin access to this thread
        const hasAccess = await ctx.runQuery(internal.chat.sharing.checkThreadAccess, {
            threadId: invite.threadId,
            userId,
            requiredPermission: "admin",
        });

        if (!hasAccess) {
            throw new ConvexError("Admin access required to revoke invites");
        }

        await ctx.db.patch(inviteId, { status: "revoked" });
        return null;
    },
});

// Accept an invite
export const acceptThreadInvite = authedMutation({
    args: {
        inviteToken: v.string(),
    },
    returns: v.object({
        threadId: v.string(),
        permission: v.union(v.literal("read"), v.literal("write"), v.literal("admin")),
    }),
    handler: async (ctx, { inviteToken }) => {
        const userId = ctx.user._id;

        const invite = await ctx.db
            .query("threadInvites")
            .withIndex("by_invite_token", (q) => q.eq("inviteToken", inviteToken))
            .unique();

        if (!invite) {
            throw new ConvexError("Invalid invite token");
        }

        if (invite.status !== "pending") {
            throw new ConvexError("Invite is no longer valid");
        }

        if (invite.expiresAt < Date.now()) {
            await ctx.db.patch(invite._id, { status: "expired" });
            throw new ConvexError("Invite has expired");
        }

        // Check if user already has access
        const existingAccess = await ctx.db
            .query("threadAccess")
            .withIndex("by_thread_and_user", (q) =>
                q.eq("threadId", invite.threadId).eq("userId", userId)
            )
            .unique();

        if (existingAccess) {
            // Update existing access with new permission
            await ctx.db.patch(existingAccess._id, {
                permission: invite.permission,
                grantedBy: invite.invitedBy,
                grantedAt: Date.now(),
            });
        } else {
            // Create new access
            await ctx.db.insert("threadAccess", {
                threadId: invite.threadId,
                userId,
                permission: invite.permission,
                grantedBy: invite.invitedBy,
                grantedAt: Date.now(),
            });
        }

        // Mark invite as accepted
        await ctx.db.patch(invite._id, {
            status: "accepted",
            acceptedAt: Date.now(),
            acceptedBy: userId,
        });

        return {
            threadId: invite.threadId,
            permission: invite.permission,
        };
    },
});

// Remove user access from thread
export const removeThreadAccess = authedMutation({
    args: {
        threadId: v.string(),
        targetUserId: v.id("users"),
    },
    returns: v.null(),
    handler: async (ctx, { threadId, targetUserId }) => {
        const userId = ctx.user._id;

        // Check if user has admin access to this thread
        const hasAccess = await ctx.runQuery(internal.chat.sharing.checkThreadAccess, {
            threadId,
            userId,
            requiredPermission: "admin",
        });

        if (!hasAccess) {
            throw new ConvexError("Admin access required to remove users");
        }

        // Don't allow removing the thread owner
        const thread = await ctx.runQuery(internal.chat.functions.getThread, { threadId });
        if (thread?.userId === targetUserId) {
            throw new ConvexError("Cannot remove thread owner");
        }

        const access = await ctx.db
            .query("threadAccess")
            .withIndex("by_thread_and_user", (q) =>
                q.eq("threadId", threadId).eq("userId", targetUserId)
            )
            .unique();

        if (access) {
            await ctx.db.delete(access._id);
        }

        return null;
    },
});

// Toggle thread public visibility
export const toggleThreadVisibility = authedMutation({
    args: {
        threadId: v.string(),
        isPublic: v.boolean(),
    },
    returns: v.object({
        isPublic: v.boolean(),
        publicAccessToken: v.optional(v.string()),
    }),
    handler: async (ctx, { threadId, isPublic }) => {
        const userId = ctx.user._id;

        // Check if user has admin access to this thread
        const hasAccess = await ctx.runQuery(internal.chat.sharing.checkThreadAccess, {
            threadId,
            userId,
            requiredPermission: "admin",
        });

        if (!hasAccess) {
            throw new ConvexError("Admin access required to change thread visibility");
        }

        const existingVisibility = await ctx.db
            .query("threadVisibility")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .unique();

        if (existingVisibility) {
            await ctx.db.patch(existingVisibility._id, {
                isPublic,
                publicAccessToken: isPublic ? generateToken() : undefined,
                updatedAt: Date.now(),
            });
        } else {
            await ctx.db.insert("threadVisibility", {
                threadId,
                isPublic,
                publicAccessToken: isPublic ? generateToken() : undefined,
                createdBy: userId,
                updatedAt: Date.now(),
            });
        }

        return {
            isPublic,
            publicAccessToken: isPublic ? generateToken() : undefined,
        };
    },
});

// Get public thread by access token
export const getPublicThread = authedQuery({
    args: {
        publicAccessToken: v.string(),
    },
    returns: v.union(
        v.object({
            threadId: v.string(),
            title: v.optional(v.string()),
            isPublic: v.boolean(),
        }),
        v.null()
    ),
    handler: async (ctx, { publicAccessToken }) => {
        const visibility = await ctx.db
            .query("threadVisibility")
            .withIndex("by_public_access_token", (q) => q.eq("publicAccessToken", publicAccessToken))
            .unique();

        if (!visibility || !visibility.isPublic) {
            return null;
        }

        const thread = await ctx.runQuery(internal.chat.functions.getThread, {
            threadId: visibility.threadId
        });

        if (!thread) {
            return null;
        }

        return {
            threadId: visibility.threadId,
            title: thread.title,
            isPublic: true,
        };
    },
});