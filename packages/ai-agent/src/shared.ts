import type { CoreMessage } from "ai";
import type { Message } from "./validators";

export const DEFAULT_RECENT_MESSAGES = 100;

export function isTool(message: Message | CoreMessage) {
  return (
    message.role === "tool" ||
    (message.role === "assistant" &&
      Array.isArray(message.content) &&
      message.content.some((c) => c.type === "tool-call"))
  );
}

export function extractText(message: Message | CoreMessage) {
  switch (message.role) {
    case "user":
      if (typeof message.content === "string") {
        return message.content;
      }
      return message.content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("");
    case "assistant":
      if (typeof message.content === "string") {
        return message.content;
      }
      return message.content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("");
  }
  return undefined;
}

export const DEFAULT_MESSAGE_RANGE = { before: 2, after: 1 };
