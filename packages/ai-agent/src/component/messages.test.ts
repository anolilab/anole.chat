

import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { getMaxMessage } from "./messages";
import schema from "./schema";
import { modules } from "./setup.test";

describe("agent", () => {
  test("getMaxMessage works for threads", async () => {
    const t = convexTest(schema, modules);
    const thread = await t.mutation(api.threads.createThread, {
      userId: "test",
    });
    const { messages } = await t.mutation(api.messages.addMessages, {
      threadId: thread._id as Id<"threads">,
      messages: [
        { message: { role: "user", content: "hello" } },
        { message: { role: "assistant", content: "world" } },
      ],
    });
    const maxMessage = await t.run(async (ctx) => {
      return await getMaxMessage(ctx, thread._id as Id<"threads">);
    });
    expect(maxMessage).toMatchObject({
      _id: messages.at(-1)!._id,
      order: 0,
      stepOrder: 1,
    });
  });
  test("getMaxMessages works when there are tools involved", async () => {
    const t = convexTest(schema, modules);
    const thread = await t.mutation(api.threads.createThread, {
      userId: "test",
    });
    const { messages } = await t.mutation(api.messages.addMessages, {
      threadId: thread._id as Id<"threads">,
      messages: [
        { message: { role: "user", content: "hello" } },
        {
          message: {
            role: "assistant",
            content: [
              {
                type: "tool-call",
                args: { a: 1 },
                toolCallId: "1",
                toolName: "tool",
              },
            ],
          },
        },
        {
          message: {
            role: "tool",
            content: [
              {
                type: "tool-result",
                toolName: "tool",
                result: "foo",
                toolCallId: "1",
              },
            ],
          },
        },
        { message: { role: "assistant", content: "world" } },
      ],
    });
    const maxMessage = await t.run(async (ctx) => {
      return await getMaxMessage(ctx, thread._id as Id<"threads">);
    });
    expect(maxMessage).toMatchObject({
      _id: messages.at(-1)!._id,
      order: 0,
      stepOrder: 3,
    });
  });

  test("ordering is incremented on subsequent calls to addMessages", async () => {
    const t = convexTest(schema, modules);
    const thread = await t.mutation(api.threads.createThread, {
      userId: "test",
    });
    const { messages } = await t.mutation(api.messages.addMessages, {
      threadId: thread._id as Id<"threads">,
      messages: [{ message: { role: "user", content: "hello" } }],
    });
    const maxMessage = await t.run(async (ctx) => {
      return await getMaxMessage(ctx, thread._id as Id<"threads">);
    });
    expect(maxMessage).toMatchObject({
      _id: messages.at(-1)!._id,
      order: 0,
      stepOrder: 0,
    });
    const { messages: messages2 } = await t.mutation(api.messages.addMessages, {
      threadId: thread._id as Id<"threads">,
      messages: [{ message: { role: "user", content: "hello" } }],
    });
    const maxMessage2 = await t.run(async (ctx) => {
      return await getMaxMessage(ctx, thread._id as Id<"threads">);
    });
    expect(maxMessage2).toMatchObject({
      _id: messages2.at(-1)!._id,
      order: 1,
      stepOrder: 0,
    });
  });

  test("sub order is incremented on subsequent calls to addMessages for the same promptMessageId", async () => {
    const t = convexTest(schema, modules);
    const thread = await t.mutation(api.threads.createThread, {
      userId: "test",
    });
    const { messages } = await t.mutation(api.messages.addMessages, {
      threadId: thread._id as Id<"threads">,
      messages: [{ message: { role: "user", content: "hello" } }],
    });
    const maxMessage = await t.run(async (ctx) => {
      return await getMaxMessage(ctx, thread._id as Id<"threads">);
    });
    expect(maxMessage).toMatchObject({
      _id: messages.at(-1)!._id,
      order: 0,
      stepOrder: 0,
    });
    const { messages: messages2 } = await t.mutation(api.messages.addMessages, {
      threadId: thread._id as Id<"threads">,
      messages: [{ message: { role: "user", content: "hello" } }],
      agentName: "test",
      promptMessageId: messages.at(-1)!._id as Id<"messages">,
    });
    const maxMessage2 = await t.run(async (ctx) => {
      return await getMaxMessage(ctx, thread._id as Id<"threads">);
    });
    expect(maxMessage2).toMatchObject({
      _id: messages2.at(-1)!._id,
      order: 0,
      stepOrder: 1,
    });
  });

  test("updateMessage updates message content", async () => {
    const t = convexTest(schema, modules);
    const thread = await t.mutation(api.threads.createThread, {
      userId: "test",
    });
    const { messages } = await t.mutation(api.messages.addMessages, {
      threadId: thread._id as Id<"threads">,
      messages: [{ message: { role: "user", content: "hello" } }],
    });
    const messageId = messages[0]._id as Id<"messages">;
    
    const updatedMessage = await t.mutation(internal.messages.updateMessage, {
      messageId,
      patch: {
        message: { role: "user", content: "updated content" },
      },
    });
    
    expect(updatedMessage.message).toEqual({
      role: "user",
      content: "updated content",
    });
  });

  test("updateMessage updates message status", async () => {
    const t = convexTest(schema, modules);
    const thread = await t.mutation(api.threads.createThread, {
      userId: "test",
    });
    const { messages } = await t.mutation(api.messages.addMessages, {
      threadId: thread._id as Id<"threads">,
      messages: [{ message: { role: "assistant", content: "hello" } }],
      pending: true,
    });
    const messageId = messages[0]._id as Id<"messages">;
    
    // Initial status should be pending
    expect(messages[0].status).toBe("pending");
    
    // Update to success
    const updatedMessage = await t.mutation(internal.messages.updateMessage, {
      messageId,
      patch: {
        status: "success",
      },
    });
    
    expect(updatedMessage.status).toBe("success");
  });

  test("updateMessage updates error field", async () => {
    const t = convexTest(schema, modules);
    const thread = await t.mutation(api.threads.createThread, {
      userId: "test",
    });
    const { messages } = await t.mutation(api.messages.addMessages, {
      threadId: thread._id as Id<"threads">,
      messages: [{ message: { role: "assistant", content: "hello" } }],
      pending: true,
    });
    const messageId = messages[0]._id as Id<"messages">;
    
    const updatedMessage = await t.mutation(internal.messages.updateMessage, {
      messageId,
      patch: {
        status: "failed",
        error: "Something went wrong",
      },
    });
    
    expect(updatedMessage.status).toBe("failed");
    expect(updatedMessage.error).toBe("Something went wrong");
  });

  test("updateMessage correctly updates tool messages", async () => {
    const t = convexTest(schema, modules);
    const thread = await t.mutation(api.threads.createThread, {
      userId: "test",
    });
    const { messages } = await t.mutation(api.messages.addMessages, {
      threadId: thread._id as Id<"threads">,
      messages: [{
        message: {
          role: "assistant",
          content: [
            {
              type: "tool-call",
              args: { a: 1 },
              toolCallId: "1",
              toolName: "tool",
            },
          ],
        },
      }],
    });
    const messageId = messages[0]._id as Id<"messages">;
    
    const updatedMessage = await t.mutation(internal.messages.updateMessage, {
      messageId,
      patch: {
        message: {
          role: "assistant",
          content: [
            {
              type: "tool-call",
              args: { a: 2, b: 3 },
              toolCallId: "1",
              toolName: "tool",
            },
          ],
        },
      },
    });
    
    expect(updatedMessage.message).toEqual({
      role: "assistant",
      content: [
        {
          type: "tool-call",
          args: { a: 2, b: 3 },
          toolCallId: "1",
          toolName: "tool",
        },
      ],
    });
  });

  test("updateMessage throws error for non-existent message", async () => {
    const t = convexTest(schema, modules);
    
    await expect(
      t.mutation(internal.messages.updateMessage, {
        messageId: "invalidId" as Id<"messages">,
        patch: {
          message: { role: "user", content: "test" },
        },
      })
    ).rejects.toThrow();
  });
});
