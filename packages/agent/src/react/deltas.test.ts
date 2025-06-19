import { describe, it, expect } from "vitest";
import { mergeDeltas, applyDeltasToStreamMessage } from "./deltas";
import type {
  StreamMessage,
  StreamDelta,
  TextStreamPart,
} from "../validators";
import { omit } from "convex-helpers";

function makeStreamMessage(
  streamId: string,
  order: number,
  stepOrder: number
): StreamMessage {
  return {
    streamId,
    order,
    stepOrder,
  } as StreamMessage;
}

function makeDelta(
  streamId: string,
  start: number,
  end: number,
  parts: TextStreamPart[]
): StreamDelta {
  return {
    streamId,
    start,
    end,
    parts,
  };
}

describe("mergeDeltas", () => {
  it("merges a single text-delta into a message", () => {
    const streamId = "s1";
    const streamMessages = [makeStreamMessage(streamId, 1, 0)];
    const deltas = [
      makeDelta(streamId, 0, 5, [{ type: "text-delta", textDelta: "Hello" }]),
    ];
    const [messages, newStreams, changed] = mergeDeltas(
      "thread1",
      streamMessages,
      [],
      deltas
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toBe("Hello");
    expect(messages[0].message?.role).toBe("assistant");
    expect(changed).toBe(true);
    expect(newStreams[0].cursor).toBe(5);
  });

  it("merges multiple deltas for the same stream", () => {
    const streamId = "s1";
    const streamMessages = [makeStreamMessage(streamId, 1, 0)];
    const deltas = [
      makeDelta(streamId, 0, 5, [{ type: "text-delta", textDelta: "Hello" }]),
      makeDelta(streamId, 5, 11, [
        { type: "text-delta", textDelta: " World!" },
      ]),
    ];
    const [messages, newStreams, changed] = mergeDeltas(
      "thread1",
      streamMessages,
      [],
      deltas
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toBe("Hello World!");
    expect(changed).toBe(true);
    expect(newStreams[0].cursor).toBe(11);
  });

  it("handles tool-call and tool-result parts", () => {
    const streamId = "s2";
    const streamMessages = [makeStreamMessage(streamId, 2, 0)];
    const deltas = [
      makeDelta(streamId, 0, 1, [
        {
          type: "tool-call",
          toolCallId: "call1",
          toolName: "myTool",
          args: "",
        },
      ]),
      makeDelta(streamId, 1, 2, [
        {
          type: "tool-result",
          toolCallId: "call1",
          toolName: "myTool",
          result: "42",
        },
      ]),
    ];
    const [messages, _, changed] = mergeDeltas(
      "thread1",
      streamMessages,
      [],
      deltas
    );
    expect(messages).toHaveLength(2);
    expect(messages[0].message?.role).toBe("assistant");
    expect(messages[0].tool).toBe(true);
    const content = messages[0].message?.content;
    expect(content).toEqual([
      {
        type: "tool-call",
        toolCallId: "call1",
        toolName: "myTool",
        args: "",
      },
    ]);
    expect(messages[1].message?.role).toBe("tool");
    expect(messages[1].tool).toBe(true);
    expect(messages[1].message?.content).toEqual([
      {
        type: "tool-result",
        toolCallId: "call1",
        toolName: "myTool",
        result: "42",
      },
    ]);
    expect(changed).toBe(true);
  });

  it("returns changed=false if no new deltas", () => {
    const streamId = "s3";
    const streamMessages = [makeStreamMessage(streamId, 3, 0)];
    const deltas: StreamDelta[] = [];
    const [messages, newStreams, changed] = mergeDeltas(
      "thread1",
      streamMessages,
      [],
      deltas
    );
    expect(messages).toHaveLength(0);
    expect(changed).toBe(false);
    expect(newStreams[0].cursor).toBe(0);
  });

  it("handles multiple streams and sorts by order/stepOrder", () => {
    const s1 = makeStreamMessage("s1", 1, 0);
    const s2 = makeStreamMessage("s2", 2, 0);
    const deltas = [
      makeDelta("s2", 0, 3, [{ type: "text-delta", textDelta: "B" }]),
      makeDelta("s1", 0, 3, [{ type: "text-delta", textDelta: "A" }]),
    ];
    const [messages, _, changed] = mergeDeltas("thread1", [s2, s1], [], deltas);
    expect(messages).toHaveLength(2);
    expect(messages[0].text).toBe("A");
    expect(messages[1].text).toBe("B");
    expect(changed).toBe(true);
    // Sorted by order
    expect(messages[0].order).toBe(1);
    expect(messages[1].order).toBe(2);
  });

  it("does not duplicate text content when merging sequential text-deltas", () => {
    const streamId = "s4";
    const streamMessages = [makeStreamMessage(streamId, 4, 0)];
    const deltas = [
      makeDelta(streamId, 0, 5, [{ type: "text-delta", textDelta: "Hello" }]),
      makeDelta(streamId, 5, 11, [
        { type: "text-delta", textDelta: " World!" },
      ]),
      makeDelta(streamId, 11, 12, [{ type: "text-delta", textDelta: "!" }]),
    ];
    const [messages] = mergeDeltas("thread1", streamMessages, [], deltas);
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toBe("Hello World!!");
    // There should only be one text part per message
    const content = messages[0].message?.content;
    if (Array.isArray(content)) {
      const textParts = content.filter((p) => p.type === "text");
      expect(textParts).toHaveLength(1);
      expect(textParts[0].text).toBe("Hello World!!");
    }
  });

  it("does not duplicate reasoning parts", () => {
    const streamId = "s6";
    const streamMessages = [makeStreamMessage(streamId, 6, 0)];
    const deltas = [
      makeDelta(streamId, 0, 1, [
        { type: "reasoning", textDelta: "I'm thinking..." },
      ]),
      makeDelta(streamId, 1, 2, [
        { type: "reasoning", textDelta: " Still thinking..." },
      ]),
    ];
    const [messages] = mergeDeltas("thread1", streamMessages, [], deltas);
    expect(messages).toHaveLength(1);
    if (Array.isArray(messages[0].message?.content)) {
      const reasoningParts = messages[0].message.content.filter(
        (p) => p.type === "reasoning"
      );
      expect(reasoningParts).toHaveLength(1);
      expect(reasoningParts[0].text).toBe("I'm thinking... Still thinking...");
    }
  });

  it("applyDeltasToStreamMessage is idempotent and does not duplicate content", () => {
    const streamId = "s7";
    const streamMessage = makeStreamMessage(streamId, 7, 0);
    const deltas = [
      makeDelta(streamId, 0, 5, [{ type: "text-delta", textDelta: "Hello" }]),
      makeDelta(streamId, 5, 11, [
        { type: "text-delta", textDelta: " World!" },
      ]),
    ];
    // First call: apply both deltas
    let [result, changed] = applyDeltasToStreamMessage(
      "thread1",
      streamMessage,
      undefined,
      deltas
    );
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].text).toBe("Hello World!");
    // Second call: re-apply the same deltas (should not duplicate)
    [result, changed] = applyDeltasToStreamMessage(
      "thread1",
      streamMessage,
      result,
      deltas
    );
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].text).toBe("Hello World!");
    // Third call: add a new delta
    const moreDeltas = [
      ...deltas,
      makeDelta(streamId, 11, 12, [{ type: "text-delta", textDelta: "!" }]),
    ];
    [result, changed] = applyDeltasToStreamMessage(
      "thread1",
      streamMessage,
      result,
      moreDeltas
    );
    expect(changed).toBe(true);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].text).toBe("Hello World!!");
    // Re-apply all deltas again (should still not duplicate)
    [result, changed] = applyDeltasToStreamMessage(
      "thread1",
      streamMessage,
      result,
      moreDeltas
    );
    expect(changed).toBe(false);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].text).toBe("Hello World!!");
  });

  it("mergeDeltas is pure and does not mutate inputs", () => {
    const streamId = "s8";
    const streamMessages = [makeStreamMessage(streamId, 8, 0)];
    const deltas = [
      makeDelta(streamId, 0, 5, [{ type: "text-delta", textDelta: "Hello" }]),
      makeDelta(streamId, 5, 11, [
        { type: "text-delta", textDelta: " World!" },
      ]),
    ];
    // Deep freeze inputs to catch mutation
    function deepFreeze(obj: unknown): unknown {
      if (obj && typeof obj === "object" && !Object.isFrozen(obj)) {
        Object.freeze(obj);
        for (const key of Object.keys(obj)) {
          deepFreeze((obj as Record<string, unknown>)[key]);
        }
      }
      return obj;
    }
    deepFreeze(streamMessages);
    deepFreeze(deltas);
    const [messages1, streams1, changed1] = mergeDeltas(
      "thread1",
      streamMessages,
      [],
      deltas
    );
    const [messages2, streams2, changed2] = mergeDeltas(
      "thread1",
      streamMessages,
      [],
      deltas
    );
    expect(messages1.map((m) => omit(m, ["_creationTime"]))).toEqual(
      messages2.map((m) => omit(m, ["_creationTime"]))
    );
    expect(
      streams1.map((s) => ({
        ...s,
        messages: s.messages.map((m) => omit(m, ["_creationTime"])),
      }))
    ).toEqual(
      streams2.map((s) => ({
        ...s,
        messages: s.messages.map((m) => omit(m, ["_creationTime"])),
      }))
    );
    expect(changed1).toBe(changed2);
    // Inputs should remain unchanged
    expect(streamMessages).toEqual([makeStreamMessage(streamId, 8, 0)]);
    expect(deltas).toEqual([
      makeDelta(streamId, 0, 5, [{ type: "text-delta", textDelta: "Hello" }]),
      makeDelta(streamId, 5, 11, [
        { type: "text-delta", textDelta: " World!" },
      ]),
    ]);
  });
});
