import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authedMutation, authedQuery } from "../auth/functions";

export const saveDocument = authedMutation({
    args: {
        id: v.string(),
        title: v.string(),
        kind: v.union(v.literal("text"), v.literal("code"), v.literal("sheet")),
        content: v.string(),
        messageId: v.optional(v.string()),
    },
    handler: async (ctx, { id, title, kind, content, messageId }) => {
        return await ctx.db.insert("documents", {
            content,
            kind,
            messageId,
            title,
            userId: ctx.user._id,
        });
    },
});

export const getDocumentsById = authedQuery({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        return await ctx.db
            .query("documents")
            .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
            .filter((q) => q.eq(q.field("_id"), id))
            .order("asc")
            .collect();
    },
});

export const getDocumentsByMessageId = authedQuery({
    args: {
        messageId: v.string(),
    },
    handler: async (ctx, { messageId }) => {
        return await ctx.db
            .query("documents")
            .withIndex("by_message", (q) => q.eq("messageId", messageId))
            .filter((q) => q.eq(q.field("userId"), ctx.user._id))
            .order("asc")
            .collect();
    },
});

export const saveDocumentVersion = authedMutation({
    args: {
        documentId: v.id("documents"),
        content: v.string(),
        version: v.number(),
        messageId: v.optional(v.string()),
    },
    handler: async (ctx, { documentId, content, version, messageId }) => {
        return await ctx.db.insert("documentVersions", {
            content,
            documentId,
            messageId,
            version,
        });
    },
});

export const getDocumentVersions = authedQuery({
    args: {
        documentId: v.id("documents"),
    },
    handler: async (ctx, { documentId }) => {
        return await ctx.db
            .query("documentVersions")
            .withIndex("by_document", (q) => q.eq("documentId", documentId))
            .order("asc")
            .collect();
    },
});

export const saveSuggestion = authedMutation({
    args: {
        documentId: v.id("documents"),
        content: v.string(),
        type: v.union(
            v.literal("improvement"),
            v.literal("correction"),
            v.literal("enhancement")
        ),
        messageId: v.optional(v.string()),
    },
    handler: async (ctx, { documentId, content, type, messageId }) => {
        return await ctx.db.insert("suggestions", {
            content,
            documentId,
            messageId,
            type,
        });
    },
});

export const getSuggestionsByDocumentId = authedQuery({
    args: {
        documentId: v.id("documents"),
    },
    handler: async (ctx, { documentId }) => {
        return await ctx.db
            .query("suggestions")
            .withIndex("by_document", (q) => q.eq("documentId", documentId))
            .order("asc")
            .collect();
    },
});

export const getMyDocuments = authedQuery({
    args: {
        kind: v.optional(v.union(v.literal("text"), v.literal("code"), v.literal("sheet"))),
    },
    handler: async (ctx, { kind }) => {
        if (kind) {
            return await ctx.db
                .query("documents")
                .withIndex("by_user_and_kind", (q) => 
                    q.eq("userId", ctx.user._id).eq("kind", kind)
                )
                .order("desc")
                .collect();
        }
        
        return await ctx.db
            .query("documents")
            .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
            .order("desc")
            .collect();
    },
});