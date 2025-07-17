import { defineTable } from "convex/server";
import { v } from "convex/values";

import { softDeleteFields } from "../lib/systemFields";

const chatTables = {
    // Thread sharing and access control
    threadAccess: defineTable({
        expiresAt: v.optional(v.number()), // Optional expiration timestamp
        grantedAt: v.number(),
        grantedBy: v.id("users"), // Who granted this access
        permission: v.union(
            v.literal("read"),
            v.literal("write"),
            v.literal("admin"),
        ),
        threadId: v.string(),
        userId: v.id("users"),
    })
        .index("by_thread", ["threadId"])
        .index("by_user", ["userId"])
        .index("by_thread_and_user", ["threadId", "userId"])
        .index("by_user_and_permission", ["userId", "permission"]),

    // Thread invites
    threadInvites: defineTable({
        acceptedAt: v.optional(v.number()), // When the invite was accepted
        acceptedBy: v.optional(v.id("users")), // Who accepted the invite
        expiresAt: v.number(), // When the invite expires
        invitedBy: v.id("users"),
        invitedEmail: v.string(),
        inviteToken: v.string(), // Unique token for the invite link
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
        threadId: v.string(),
    })
        .index("by_thread", ["threadId"])
        .index("by_invited_email", ["invitedEmail"])
        .index("by_invite_token", ["inviteToken"])
        .index("by_status", ["status"])
        .index("by_expires_at", ["expiresAt"]),

    // Thread relationships for branching and hierarchy
    threadRelationships: defineTable({
        branchPoint: v.optional(v.number()), // Which message index the branch started from (0-based)
        branchType: v.optional(
            v.union(v.literal("branch"), v.literal("continuation")),
        ), // Type of relationship
        createdAt: v.number(), // When this relationship was created
        parentThreadId: v.string(), // The parent thread this was branched from
        threadId: v.string(), // The child thread
    })
        .index("by_thread", ["threadId"])
        .index("by_parent", ["parentThreadId"])
        .index("by_parent_and_thread", ["parentThreadId", "threadId"]),

    threads: defineTable({
        createdBy: v.optional(v.id("users")),
        isPublic: v.optional(v.boolean()),
        model: v.optional(v.string()),
        order: v.optional(v.number()),
        pinnedAt: v.optional(v.number()),
        publicAccessToken: v.optional(v.string()),
        threadId: v.string(), // required
        updatedAt: v.optional(v.number()),
        userId: v.optional(v.id("users")),
        ...softDeleteFields,
    })
        .index("by_thread", ["threadId"])
        .index("by_user", ["userId"]),
};

export default chatTables;
