import { assert, omit } from "convex-helpers";
import { mergedStream, stream } from "convex-helpers/server/stream";
import { paginationOptsValidator } from "convex/server";
import type { ObjectType } from "convex/values";
import {
  DEFAULT_MESSAGE_RANGE,
  DEFAULT_RECENT_MESSAGES,
  extractText,
  isTool,
} from "../shared";
import {
  vMessageEmbeddings,
  vMessageStatus,
  vMessageWithMetadataInternal,
  vPaginationResult,
  vSearchOptions,
} from "../validators";
import { api, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  action,
  internalQuery,
  mutation,
  type MutationCtx,
  query,
  type QueryCtx,
} from "./_generated/server";
import type { MessageDoc } from "./schema";
import { schema, v, vMessageDoc } from "./schema";
import {
  getThread as _getThread,
  listThreadsByUserId as _listThreadsByUserId,
  updateThread as _updateThread,
} from "./threads";
import { insertVector, searchVectors } from "./vector/index";
import {
  type VectorDimension,
  VectorDimensions,
  type VectorTableId,
  vVectorId,
} from "./vector/tables";

/** @deprecated Use *.threads.listMessagesByThreadId instead. */
export const listThreadsByUserId = _listThreadsByUserId;

/** @deprecated Use *.threads.getThread */
export const getThread = _getThread;

/** @deprecated Use *.threads.updateThread instead */
export const updateThread = _updateThread;

function publicMessage(message: Doc<"messages">): MessageDoc {
  return omit(message, ["parentMessageId", "stepId", "files"]);
}

export async function deleteMessage(
  ctx: MutationCtx,
  messageDoc: Doc<"messages">
) {
  await ctx.db.delete(messageDoc._id);
  if (messageDoc.embeddingId) {
    await ctx.db.delete(messageDoc.embeddingId);
  }
  for (const fileId of messageDoc.fileIds ?? []) {
    if (!fileId) continue;
    const file = await ctx.db.get(fileId);
    if (file) {
      await ctx.db.patch(fileId, { refcount: file.refcount - 1 });
    }
  }
}

export const messageStatuses = vMessageDoc.fields.status.members.map(
  (m) => m.value
);

const addMessagesArgs = {
  userId: v.optional(v.string()),
  threadId: v.id("threads"),
  promptMessageId: v.optional(v.id("messages")),
  agentName: v.optional(v.string()),
  messages: v.array(vMessageWithMetadataInternal),
  embeddings: v.optional(vMessageEmbeddings),
  pending: v.optional(v.boolean()),
  failPendingSteps: v.optional(v.boolean()),
};
export const addMessages = mutation({
  args: addMessagesArgs,
  handler: addMessagesHandler,
  returns: v.object({
    messages: v.array(vMessageDoc),
  }),
});
async function addMessagesHandler(
  ctx: MutationCtx,
  args: ObjectType<typeof addMessagesArgs>
) {
  let userId = args.userId;
  const threadId = args.threadId;
  if (!userId && args.threadId) {
    const thread = await ctx.db.get(args.threadId);
    assert(thread, `Thread ${args.threadId} not found`);
    userId = thread.userId;
  }
  const {
    embeddings,
    failPendingSteps,
    pending,
    messages,
    promptMessageId,
    ...rest
  } = args;
  const parentMessage = promptMessageId && (await ctx.db.get(promptMessageId));
  if (failPendingSteps) {
    assert(args.threadId, "threadId is required to fail pending steps");
    const pendingMessages = await ctx.db
      .query("messages")
      .withIndex("threadId_status_tool_order_stepOrder", (q) =>
        q.eq("threadId", threadId).eq("status", "pending")
      )
      .collect();
    await Promise.all(
      pendingMessages
        .filter((m) => !parentMessage || m.order === parentMessage.order)
        .map((m) =>
          ctx.db.patch(m._id, { status: "failed", error: "Restarting" })
        )
    );
  }
  let order, stepOrder;
  let fail = false;
  if (promptMessageId) {
    assert(parentMessage, `Parent message ${promptMessageId} not found`);
    if (parentMessage.status === "failed") {
      fail = true;
    }
    order = parentMessage.order;
    // Defend against there being existing messages with this parent.
    const maxMessage = await getMaxMessage(ctx, threadId, order);
    stepOrder = maxMessage?.stepOrder ?? parentMessage.stepOrder;
  } else {
    const maxMessage = await getMaxMessage(ctx, threadId);
    order = maxMessage ? maxMessage.order + 1 : 0;
    stepOrder = -1;
  }
  const toReturn: Doc<"messages">[] = [];
  if (embeddings) {
    assert(
      embeddings.vectors.length === messages.length,
      "embeddings.vectors.length must match messages.length"
    );
  }
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    let embeddingId: VectorTableId | undefined;
    if (embeddings && embeddings.vectors[i]) {
      embeddingId = await insertVector(ctx, embeddings.dimension, {
        vector: embeddings.vectors[i]!,
        model: embeddings.model,
        table: "messages",
        userId,
        threadId,
      });
    }
    stepOrder++;
    const messageId = await ctx.db.insert("messages", {
      ...rest,
      ...message,
      embeddingId,
      parentMessageId: promptMessageId,
      userId,
      order,
      tool: isTool(message.message),
      text: extractText(message.message),
      status: fail ? "failed" : pending ? "pending" : "success",
      error: fail ? "Parent message failed" : undefined,
      stepOrder,
    });
    // Let's just not set the id field and have it set only in explicit cases.
    // if (!message.id) {
    //   await ctx.db.patch(messageId, {
    //     id: messageId,
    //   });
    // }
    for (const fileId of message.fileIds ?? []) {
      if (!fileId) continue;
      await ctx.db.patch(fileId, {
        refcount: (await ctx.db.get(fileId))!.refcount + 1,
      });
    }
    // TODO: delete the associated stream data for the order/stepOrder
    toReturn.push((await ctx.db.get(messageId))!);
  }
  return { messages: toReturn.map(publicMessage) };
}

// exported for tests
export async function getMaxMessage(
  ctx: QueryCtx,
  threadId: Id<"threads">,
  order?: number
) {
  return orderedMessagesStream(ctx, threadId, "desc", order).first();
}

function orderedMessagesStream(
  ctx: QueryCtx,
  threadId: Id<"threads">,
  sortOrder: "asc" | "desc",
  order?: number
) {
  return mergedStream(
    [true, false].flatMap((tool) =>
      messageStatuses.map((status) =>
        stream(ctx.db, schema)
          .query("messages")
          .withIndex("threadId_status_tool_order_stepOrder", (q) => {
            const qq = q
              .eq("threadId", threadId)
              .eq("status", status)
              .eq("tool", tool);
            if (order) {
              return qq.eq("order", order);
            }
            return qq;
          })
          .order(sortOrder)
      )
    ),
    ["order", "stepOrder"]
  );
}

export const rollbackMessage = mutation({
  args: {
    messageId: v.id("messages"),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { messageId, error }) => {
    const message = await ctx.db.get(messageId);
    assert(message, `Message ${messageId} not found`);
    const messages = await orderedMessagesStream(
      ctx,
      message.threadId,
      "asc",
      message.order
    ).collect();
    for (const m of messages) {
      if (m.status === "pending") {
        await ctx.db.patch(m._id, { status: "failed", error });
      }
    }

    await ctx.db.patch(messageId, {
      status: "failed",
      error: error,
    });
  },
});

export const commitMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  returns: v.null(),
  handler: commitMessageHandler,
});

export const updateMessage = mutation({
  args: {
    messageId: v.id("messages"),
    patch: v.object({
      message: v.optional(vMessageDoc.fields.message),
      status: v.optional(vMessageStatus),
      error: v.optional(v.string()),
    }),
  },
  returns: vMessageDoc,
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    assert(message, `Message ${args.messageId} not found`);

    const patch: Partial<Doc<"messages">> = {
      ...args.patch,
    };

    if (args.patch.message !== undefined) {
      patch.message = args.patch.message;
      patch.tool = isTool(args.patch.message);
      patch.text = extractText(args.patch.message);
    }

    await ctx.db.patch(args.messageId, patch);
    return publicMessage((await ctx.db.get(args.messageId))!);
  },
});

async function commitMessageHandler(
  ctx: MutationCtx,
  { messageId }: { messageId: Id<"messages"> }
) {
  const message = await ctx.db.get(messageId);
  assert(message, `Message ${messageId} not found`);

  const order = message.order!;
  const messages = await mergedStream(
    [true, false].map((tool) =>
      stream(ctx.db, schema)
        .query("messages")
        .withIndex("threadId_status_tool_order_stepOrder", (q) =>
          q
            .eq("threadId", message.threadId)
            .eq("status", "pending")
            .eq("tool", tool)
            .eq("order", order)
        )
    ),
    ["order", "stepOrder"]
  ).collect();
  for (const message of messages) {
    await ctx.db.patch(message._id, { status: "success" });
  }
}

export const listMessagesByThreadId = query({
  args: {
    threadId: v.id("threads"),
    excludeToolMessages: v.optional(v.boolean()),
    /** @deprecated Use excludeToolMessages instead. */
    isTool: v.optional(v.literal("use excludeToolMessages instead of this")),
    /** What order to sort the messages in. To get the latest, use "desc". */
    order: v.union(v.literal("asc"), v.literal("desc")),
    paginationOpts: v.optional(paginationOptsValidator),
    statuses: v.optional(v.array(vMessageStatus)),
    upToAndIncludingMessageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const statuses =
      args.statuses ?? vMessageStatus.members.map((m) => m.value);
    const last =
      args.upToAndIncludingMessageId &&
      (await ctx.db.get(args.upToAndIncludingMessageId));
    assert(
      !last || last.threadId === args.threadId,
      "upToAndIncludingMessageId must be a message in the thread"
    );
    const toolOptions = args.excludeToolMessages ? [false] : [true, false];
    const order = args.order ?? "desc";
    const streams = toolOptions.flatMap((tool) =>
      statuses.map((status) =>
        stream(ctx.db, schema)
          .query("messages")
          .withIndex("threadId_status_tool_order_stepOrder", (q) => {
            const qq = q
              .eq("threadId", args.threadId)
              .eq("status", status)
              .eq("tool", tool);
            if (last) {
              return qq.lte("order", last.order);
            }
            return qq;
          })
          .order(order)
          .filterWith(
            async (m) =>
              !last ||
              m.order < last.order ||
              (m.order === last.order && m.stepOrder <= last.stepOrder)
          )
      )
    );
    const messages = await mergedStream(streams, [
      "order",
      "stepOrder",
    ]).paginate(
      args.paginationOpts ?? {
        numItems: DEFAULT_RECENT_MESSAGES,
        cursor: null,
      }
    );
    return { ...messages, page: messages.page.map(publicMessage) };
  },
  returns: vPaginationResult(vMessageDoc),
});

export const getMessagesByIds = query({
  args: {
    messageIds: v.array(v.id("messages")),
  },
  handler: async (ctx, args) => {
    return await Promise.all(args.messageIds.map((id) => ctx.db.get(id)));
  },
  returns: v.array(v.union(v.null(), vMessageDoc)),
});

/** @deprecated Use listMessagesByThreadId instead. */
export const getThreadMessages = query({
  args: { deprecated: v.literal("Use listMessagesByThreadId instead") },
  handler: async () => {
    throw new Error("Use listMessagesByThreadId instead of getThreadMessages");
  },
  returns: vPaginationResult(vMessageDoc),
});

export const searchMessages = action({
  args: {
    threadId: v.optional(v.id("threads")),
    searchAllMessagesForUserId: v.optional(v.string()),
    beforeMessageId: v.optional(v.id("messages")),
    ...vSearchOptions.fields,
  },
  returns: v.array(vMessageDoc),
  handler: async (ctx, args): Promise<MessageDoc[]> => {
    assert(
      args.searchAllMessagesForUserId || args.threadId,
      "Specify userId or threadId"
    );
    const limit = args.limit;
    let textSearchMessages: MessageDoc[] | undefined;
    if (args.text) {
      textSearchMessages = await ctx.runQuery(api.messages.textSearch, {
        searchAllMessagesForUserId: args.searchAllMessagesForUserId,
        threadId: args.threadId,
        text: args.text,
        limit,
        beforeMessageId: args.beforeMessageId,
      });
    }
    if (args.vector) {
      const dimension = args.vector.length as VectorDimension;
      if (!VectorDimensions.includes(dimension)) {
        throw new Error(`Unsupported vector dimension: ${dimension}`);
      }
      const vectors = (
        await searchVectors(ctx, args.vector, {
          dimension,
          model: args.vectorModel ?? "unknown",
          table: "messages",
          searchAllMessagesForUserId: args.searchAllMessagesForUserId,
          threadId: args.threadId,
          limit,
        })
      ).filter((v) => v._score > (args.vectorScoreThreshold ?? 0));
      // Reciprocal rank fusion
      const k = 10;
      const textEmbeddingIds = textSearchMessages?.map((m) => m.embeddingId);
      const vectorScores = vectors
        .map((v, i) => ({
          id: v._id,
          score:
            1 / (i + k) +
            1 / ((textEmbeddingIds?.indexOf(v._id) ?? Infinity) + k),
        }))
        .sort((a, b) => b.score - a.score);
      const vectorIds = vectorScores.slice(0, limit).map((v) => v.id);
      const messages: MessageDoc[] = await ctx.runQuery(
        internal.messages._fetchSearchMessages,
        {
          searchAllMessagesForUserId: args.searchAllMessagesForUserId,
          threadId: args.threadId,
          vectorIds,
          textSearchMessages: textSearchMessages?.filter(
            (m) => !vectorIds.includes(m.embeddingId! as VectorTableId)
          ),
          messageRange: args.messageRange ?? DEFAULT_MESSAGE_RANGE,
          beforeMessageId: args.beforeMessageId,
          limit,
        }
      );
      return messages;
    }
    return textSearchMessages?.flat() ?? [];
  },
});

export const _fetchSearchMessages = internalQuery({
  args: {
    threadId: v.optional(v.id("threads")),
    vectorIds: v.array(vVectorId),
    searchAllMessagesForUserId: v.optional(v.string()),
    textSearchMessages: v.optional(v.array(vMessageDoc)),
    messageRange: v.object({ before: v.number(), after: v.number() }),
    beforeMessageId: v.optional(v.id("messages")),
    limit: v.number(),
  },
  returns: v.array(vMessageDoc),
  handler: async (ctx, args): Promise<MessageDoc[]> => {
    const beforeMessage =
      args.beforeMessageId && (await ctx.db.get(args.beforeMessageId));
    const { searchAllMessagesForUserId, threadId } = args;
    assert(
      searchAllMessagesForUserId || threadId,
      "Specify searchAllMessagesForUserId or threadId to search"
    );
    let messages: MessageDoc[] = (
      await Promise.all(
        args.vectorIds.map((embeddingId) =>
          ctx.db
            .query("messages")
            .withIndex("embeddingId", (q) => q.eq("embeddingId", embeddingId))
            .filter((q) =>
              searchAllMessagesForUserId
                ? q.eq(q.field("userId"), searchAllMessagesForUserId)
                : q.eq(q.field("threadId"), threadId!)
            )
            // Don't include pending. Failed messages hopefully are deleted but may as well be safe.
            .filter((q) => q.eq(q.field("status"), "success"))
            .first()
        )
      )
    )
      .filter(
        (m): m is Doc<"messages"> =>
          m !== undefined &&
          m !== null &&
          !m.tool &&
          (!beforeMessage ||
            m.order < beforeMessage.order ||
            (m.order === beforeMessage.order &&
              m.stepOrder < beforeMessage.stepOrder))
      )
      .map(publicMessage);
    messages.push(...(args.textSearchMessages ?? []));
    // TODO: prioritize more recent messages
    messages.sort((a, b) => a.order! - b.order!);
    messages = messages.slice(0, args.limit);
    // Fetch the surrounding messages
    if (!threadId) {
      return messages.sort((a, b) => a.order - b.order);
    }
    const included: Record<string, Set<number>> = {};
    for (const m of messages) {
      const searchId = m.threadId ?? m.userId!;
      if (!included[searchId]) {
        included[searchId] = new Set();
      }
      included[searchId].add(m.order!);
    }
    const ranges: Record<string, Doc<"messages">[]> = {};
    const { before, after } = args.messageRange;
    for (const m of messages) {
      const searchId = m.threadId ?? m.userId!;
      const order = m.order!;
      let earliest = order - before;
      let latest = order + after;
      for (; earliest <= latest; earliest++) {
        if (!included[searchId].has(earliest)) {
          break;
        }
      }
      for (; latest >= earliest; latest--) {
        if (!included[searchId].has(latest)) {
          break;
        }
      }
      for (let i = earliest; i <= latest; i++) {
        included[searchId].add(i);
      }
      if (earliest !== latest) {
        const surrounding = await ctx.db
          .query("messages")
          .withIndex("threadId_status_tool_order_stepOrder", (q) =>
            q
              .eq("threadId", m.threadId as Id<"threads">)
              .eq("status", "success")
              .eq("tool", false)
              .gte("order", earliest)
              .lte("order", latest)
          )
          .collect();
        if (!ranges[searchId]) {
          ranges[searchId] = [];
        }
        ranges[searchId].push(...surrounding);
      }
    }
    for (const r of Object.values(ranges).flat()) {
      if (!messages.some((m) => m._id === r._id)) {
        messages.push(publicMessage(r));
      }
    }
    return messages.sort((a, b) => a.order - b.order);
  },
});

// returns ranges of messages in order of text search relevance,
// excluding duplicates in later ranges.
export const textSearch = query({
  args: {
    threadId: v.optional(v.id("threads")),
    searchAllMessagesForUserId: v.optional(v.string()),
    text: v.string(),
    limit: v.number(),
    beforeMessageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    assert(
      args.searchAllMessagesForUserId || args.threadId,
      "Specify userId or threadId"
    );
    const beforeMessage =
      args.beforeMessageId && (await ctx.db.get(args.beforeMessageId));
    const order = beforeMessage?.order;
    const messages = await ctx.db
      .query("messages")
      .withSearchIndex("text_search", (q) =>
        args.searchAllMessagesForUserId
          ? q
              .search("text", args.text)
              .eq("userId", args.searchAllMessagesForUserId)
          : q.search("text", args.text).eq("threadId", args.threadId!)
      )
      // Just in case tool messages slip through
      .filter((q) => {
        const qq = q.eq(q.field("tool"), false);
        if (order) {
          return q.and(qq, q.lte(q.field("order"), order));
        }
        return qq;
      })
      .take(args.limit);
    return messages
      .filter(
        (m) =>
          !beforeMessage ||
          m.order < beforeMessage.order ||
          (m.order === beforeMessage.order &&
            m.stepOrder < beforeMessage.stepOrder)
      )
      .map(publicMessage);
  },
  returns: v.array(vMessageDoc),
});
