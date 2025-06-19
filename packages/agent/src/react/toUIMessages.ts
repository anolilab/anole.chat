import type { ToolInvocationUIPart } from "@ai-sdk/ui-utils";
import type { UIMessage as AIUIMessage } from "ai";
import type { MessageDoc } from "../client/index";
import { deserializeMessage, toUIFilePart } from "../mapping";
import type { MessageStatus } from "../validators";

export type UIMessage = AIUIMessage & {
  key: string;
  order: number;
  stepOrder: number;
  status: "streaming" | MessageStatus;
};

export function toUIMessages(
  messages: (MessageDoc & { streaming?: boolean })[]
): UIMessage[] {
  const uiMessages: UIMessage[] = [];
  let assistantMessage: UIMessage | undefined;
  for (const message of messages) {
    const coreMessage = message.message && deserializeMessage(message.message);
    const text = message.text ?? "";
    const content = coreMessage?.content;
    const nonStringContent =
      content && typeof content !== "string" ? content : [];
    if (!coreMessage) continue;
    const common = {
      id: message.id ?? message._id,
      createdAt: new Date(message._creationTime),
      order: message.order,
      stepOrder: message.stepOrder,
      status: message.streaming ? ("streaming" as const) : message.status,
      key: `${message.threadId}-${message.order}-${message.stepOrder}`,
    };
    if (coreMessage.role === "system") {
      uiMessages.push({
        ...common,
        role: "system",
        content: text,
        parts: [{ type: "text", text }],
      });
    } else if (coreMessage.role === "user") {
      const parts: UIMessage["parts"] = [];
      if (text) {
        parts.push({ type: "text", text });
      }
      nonStringContent.forEach((contentPart) => {
        switch (contentPart.type) {
          case "file":
          case "image":
            parts.push(toUIFilePart(contentPart));
            break;
        }
      });
      uiMessages.push({
        ...common,
        role: "user",
        content: message.text ?? "",
        parts,
      });
    } else {
      if (coreMessage.role === "tool" && !assistantMessage) {
        console.warn(
          "Tool message without preceding assistant message.. skipping",
          message
        );
        continue;
      }
      if (!assistantMessage) {
        assistantMessage = {
          ...common,
          role: "assistant",
          content: "",
          parts: [],
        };
        uiMessages.push(assistantMessage);
      } else {
        assistantMessage.status = message.streaming
          ? "streaming"
          : message.status;
      }
      // update it to the last message's id
      assistantMessage.id = message.id ?? message._id;
      if (message.text) {
        assistantMessage.parts.push({
          type: "text",
          text: message.text,
        });
        assistantMessage.content += message.text;
      }
      if (message.reasoning) {
        assistantMessage.parts.push({
          type: "reasoning",
          reasoning: message.reasoning,
          details: message.reasoningDetails ?? [],
        });
      }
      for (const source of message.sources ?? []) {
        assistantMessage.parts.push({
          type: "source",
          source,
        });
      }
      for (const contentPart of nonStringContent) {
        switch (contentPart.type) {
          case "file":
          case "image":
            assistantMessage.parts.push(toUIFilePart(contentPart));
            break;
          case "tool-call":
            assistantMessage.parts.push({
              type: "step-start",
            });
            assistantMessage.parts.push({
              type: "tool-invocation",
              toolInvocation: {
                state: "call",
                step: assistantMessage.parts.filter(
                  (part) => part.type === "tool-invocation"
                ).length,
                toolCallId: contentPart.toolCallId,
                toolName: contentPart.toolName,
                args: contentPart.args,
              },
            });
            break;
          case "tool-result": {
            const call = assistantMessage.parts.find(
              (part) =>
                part.type === "tool-invocation" &&
                part.toolInvocation.toolCallId === contentPart.toolCallId
            ) as ToolInvocationUIPart | undefined;
            const toolInvocation: ToolInvocationUIPart["toolInvocation"] = {
              state: "result",
              toolCallId: contentPart.toolCallId,
              toolName: contentPart.toolName,
              args: call?.toolInvocation.args,
              result: contentPart.result,
              step:
                call?.toolInvocation.step ??
                assistantMessage.parts.filter(
                  (part) => part.type === "tool-invocation"
                ).length,
            };
            if (call) {
              (call as ToolInvocationUIPart).toolInvocation = toolInvocation;
            } else {
              console.warn(
                "Tool result without preceding tool call.. adding anyways",
                contentPart
              );
              assistantMessage.parts.push({
                type: "tool-invocation",
                toolInvocation,
              });
            }
            break;
          }
        }
      }
    }
    if (
      !message.tool &&
      assistantMessage &&
      assistantMessage.parts.length > 0
    ) {
      // Reset it so the next set of tool calls will create a new assistant message
      assistantMessage = undefined;
    }
  }
  return uiMessages;
}
