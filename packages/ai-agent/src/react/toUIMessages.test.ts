import { describe, it, expect } from "vitest";
import { toUIMessages } from "./toUIMessages";
import type { MessageDoc } from "../client/index";

// Helper to create a base message doc
function baseMessageDoc(overrides: Partial<MessageDoc> = {}): MessageDoc {
  return {
    _id: "msg1",
    _creationTime: Date.now(),
    order: 1,
    stepOrder: 0,
    status: "success",
    threadId: "thread1",
    tool: false,
    ...overrides,
  };
}

describe("toUIMessages", () => {
  it("handles user message", () => {
    const messages = [
      baseMessageDoc({
        message: {
          role: "user",
          content: "Hello!",
        },
        text: "Hello!",
      }),
    ];
    const uiMessages = toUIMessages(messages);
    expect(uiMessages).toHaveLength(1);
    expect(uiMessages[0].role).toBe("user");
    expect(uiMessages[0].content).toBe("Hello!");
    expect(uiMessages[0].parts[0]).toEqual({ type: "text", text: "Hello!" });
  });

  it("handles assistant message", () => {
    const messages = [
      baseMessageDoc({
        message: {
          role: "assistant",
          content: "Hi, how can I help?",
        },
        text: "Hi, how can I help?",
      }),
    ];
    const uiMessages = toUIMessages(messages);
    expect(uiMessages).toHaveLength(1);
    expect(uiMessages[0].role).toBe("assistant");
    expect(uiMessages[0].content).toBe("Hi, how can I help?");
    expect(uiMessages[0].parts[0]).toEqual({
      type: "text",
      text: "Hi, how can I help?",
    });
  });

  it("handles multiple messages", () => {
    const messages = [
      baseMessageDoc({
        message: {
          role: "user",
          content: "Hello!",
        },
        text: "Hello!",
      }),
      baseMessageDoc({
        message: {
          role: "assistant",
          content: [
            {
              type: "reasoning",
              text: "I'm thinking...",
            },
            {
              type: "redacted-reasoning",
              data: "asdfasdfasdf",
            },
            {
              type: "text",
              text: "I'm thinking...",
            },
            {
              type: "file",
              mimeType: "text/plain",
              data: "asdfasdfasdf",
            },
            {
              type: "tool-call",
              toolName: "myTool",
              toolCallId: "call1",
              args: "",
            },
          ],
        },
        tool: true,
        reasoning: "I'm thinking...",
        text: "I'm thinking...",
      }),
      baseMessageDoc({
        message: {
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: "call1",
              toolName: "myTool",
              result: "42",
            },
          ],
        },
        text: "42",
        tool: true,
      }),
    ];
    const uiMessages = toUIMessages(messages);
    expect(uiMessages).toHaveLength(2);
    expect(uiMessages[0].role).toBe("user");
    expect(uiMessages[0].parts.filter((p) => p.type === "text")).toHaveLength(
      1
    );
    expect(uiMessages[1].role).toBe("assistant");
    expect(
      uiMessages[1].parts.filter((p) => p.type === "tool-invocation")
    ).toHaveLength(1);
    expect(
      uiMessages[1].parts.filter((p) => p.type === "tool-invocation")[0]
        .toolInvocation
    ).toEqual({
      toolName: "myTool",
      toolCallId: "call1",
      args: "",
      state: "result",
      result: "42",
      step: 0,
    });
  });

  it("handles multiple text and reasoning parts", () => {
    const messages = [
      baseMessageDoc({
        message: {
          role: "assistant",
          content: [
            {
              type: "reasoning",
              text: "I'm thinking...",
            },
            {
              type: "text",
              text: "Here's one idea.",
            },
            {
              type: "reasoning",
              text: "I'm thinking...",
            },
            {
              type: "text",
              text: "Here's another idea.",
            },
          ],
        },
        reasoning: "I'm thinking...I'm thinking...",
        text: "Here's one idea. Here's another idea.",
      }),
    ];
    const uiMessages = toUIMessages(messages);
    expect(uiMessages).toHaveLength(1);
    expect(uiMessages[0].role).toBe("assistant");
    expect(uiMessages[0].content).toBe("Here's one idea. Here's another idea.");
    expect(
      uiMessages[0].parts.filter((p) => p.type === "reasoning")
    ).toHaveLength(1);
    expect(uiMessages[0].parts.filter((p) => p.type === "text")).toHaveLength(
      1
    );
    expect(uiMessages[0].parts.filter((p) => p.type === "text")[0].text).toBe(
      "Here's one idea. Here's another idea."
    );
  });

  it("handles system message", () => {
    const messages = [
      baseMessageDoc({
        message: {
          role: "system",
          content: "System message here",
        },
        text: "System message here",
      }),
    ];
    const uiMessages = toUIMessages(messages);
    expect(uiMessages).toHaveLength(1);
    expect(uiMessages[0].role).toBe("system");
    expect(uiMessages[0].content).toBe("System message here");
    expect(uiMessages[0].parts[0]).toEqual({
      type: "text",
      text: "System message here",
    });
  });

  it("handles tool call", () => {
    const messages = [
      baseMessageDoc({
        message: {
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolName: "myTool",
              toolCallId: "call1",
              args: "",
            },
          ],
        },
        text: "",
      }),
    ];
    const uiMessages = toUIMessages(messages);
    expect(uiMessages).toHaveLength(1);
    expect(uiMessages[0].role).toBe("assistant");
    expect(
      uiMessages[0].parts.filter((p) => p.type === "tool-invocation")
    ).toHaveLength(1);
    expect(
      uiMessages[0].parts.filter((p) => p.type === "tool-invocation")[0]
        .toolInvocation
    ).toEqual({
      toolName: "myTool",
      toolCallId: "call1",
      args: "",
      state: "call",
      step: 0,
    });
  });

  it("handles tool result", () => {
    const messages = [
      baseMessageDoc({
        tool: true,
        message: {
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolName: "myTool",
              toolCallId: "call1",
              args: "",
            },
          ],
        },
        text: "",
      }),
      baseMessageDoc({
        message: {
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: "call1",
              toolName: "myTool",
              result: "42",
            },
          ],
        },
        text: "",
      }),
    ];
    const uiMessages = toUIMessages(messages);
    expect(uiMessages).toHaveLength(1);
    expect(uiMessages[0].role).toBe("assistant");
    // Should have a tool-invocation part
    expect(uiMessages[0].parts.some((p) => p.type === "tool-invocation")).toBe(
      true
    );
  });

  it("does not duplicate text content", () => {
    const messages = [
      baseMessageDoc({
        message: {
          role: "assistant",
          content: "Hello!",
        },
        text: "Hello!",
      }),
    ];
    const uiMessages = toUIMessages(messages);
    // There should only be one text part
    const textParts = uiMessages[0].parts.filter((p) => p.type === "text");
    expect(textParts).toHaveLength(1);
    expect(textParts[0].text).toBe("Hello!");
  });

  // Add more tests for array content, tool calls, etc. as needed
});
