import { defineTable } from "convex/server";
import { v } from "convex/values";

const chatTables = {
    pinnedThreads: defineTable({
        pinnedAt: v.number(),
        threadId: v.string(),
        userId: v.id("users"),
    })
        .index("by_user", ["userId"])
        .index("by_thread", ["threadId"])
        .index("by_user_and_thread", ["userId", "threadId"]),

    threadOrders: defineTable({
        order: v.number(),
        threadId: v.string(),
        updatedAt: v.number(),
        userId: v.id("users"),
    })
        .index("by_user", ["userId"])
        .index("by_user_and_order", ["userId", "order"])
        .index("by_user_and_thread", ["userId", "threadId"]),

    // Thread relationships for branching and hierarchy
    threadRelationships: defineTable({
        branchPoint: v.optional(v.number()), // Which message index the branch started from (0-based)
        branchType: v.optional(v.union(v.literal("branch"), v.literal("continuation"))), // Type of relationship
        createdAt: v.number(), // When this relationship was created
        parentThreadId: v.string(), // The parent thread this was branched from
        threadId: v.string(), // The child thread
    })
        .index("by_thread", ["threadId"])
        .index("by_parent", ["parentThreadId"])
        .index("by_parent_and_thread", ["parentThreadId", "threadId"]),

    // Thread sharing and access control
    threadAccess: defineTable({
        threadId: v.string(),
        userId: v.id("users"),
        permission: v.union(
            v.literal("read"),
            v.literal("write"),
            v.literal("admin")
        ),
        grantedBy: v.id("users"), // Who granted this access
        grantedAt: v.number(),
        expiresAt: v.optional(v.number()), // Optional expiration timestamp
    })
        .index("by_thread", ["threadId"])
        .index("by_user", ["userId"])
        .index("by_thread_and_user", ["threadId", "userId"])
        .index("by_user_and_permission", ["userId", "permission"]),

    // Thread invites
    threadInvites: defineTable({
        threadId: v.string(),
        invitedEmail: v.string(),
        invitedBy: v.id("users"),
        permission: v.union(
            v.literal("read"),
            v.literal("write"),
            v.literal("admin")
        ),
        inviteToken: v.string(), // Unique token for the invite link
        expiresAt: v.number(), // When the invite expires
        acceptedAt: v.optional(v.number()), // When the invite was accepted
        acceptedBy: v.optional(v.id("users")), // Who accepted the invite
        status: v.union(
            v.literal("pending"),
            v.literal("accepted"),
            v.literal("expired"),
            v.literal("revoked")
        ),
    })
        .index("by_thread", ["threadId"])
        .index("by_invited_email", ["invitedEmail"])
        .index("by_invite_token", ["inviteToken"])
        .index("by_status", ["status"])
        .index("by_expires_at", ["expiresAt"]),

    // Thread visibility settings
    threadVisibility: defineTable({
        threadId: v.string(),
        isPublic: v.boolean(), // true = public, false = private
        publicAccessToken: v.optional(v.string()), // Optional token for public access
        createdBy: v.id("users"),
        updatedAt: v.number(),
    })
        .index("by_thread", ["threadId"])
        .index("by_public_access_token", ["publicAccessToken"])
        .index("by_is_public", ["isPublic"]),
};

export default chatTables;
