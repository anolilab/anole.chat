"use client";

import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
  type TextContentPart,
} from "@assistant-ui/react";
import { useConvex, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { ReactNode } from "react";
import type { AgentModel } from "convex/agents";
import type { Doc, Id } from "convex/_generated/dataModel";

export function ConvexRuntimeProvider({
  children,
  model,
}: {
  children: ReactNode;
  model: AgentModel;
}) {
  const convex = useConvex();
  const start = useMutation(api.chat.start);
  const sendMessage = useMutation(api.chat.sendMessage);

  let threadId: Id<"threads"> | null = null;

  const ConvexModelAdapter: ChatModelAdapter = {
    async *run({ messages, abortSignal }) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role !== "user") return;

      const textContent = lastMessage.content.find(
        (c) => c.type === "text",
      ) as TextContentPart | undefined;
      if (!textContent) return;

      if (!threadId) {
        threadId = await start({ model });
      }
console.log(threadId)
      await sendMessage({
        threadId,
        prompt: textContent.text,
        model,
      });

      let lastSynced = -1;
      let completeText = "";

      while (true) {
        if (abortSignal.aborted) return;

        const result = await convex.query(api.chat.getMessages, {
          threadId,
          streamArgs: { after: lastSynced },
        });

        if (!result) continue;

        for (const stream of result.streams) {
          for (const part of stream) {
            if (part.type === "text-delta") {
              completeText += part.textDelta;
              yield { content: [{ type: "text", text: completeText }] };
            }
            lastSynced = Math.max(lastSynced, part.syncId);
          }
        }

        const assistantMessages = result.page.filter(
          (m: Doc<"messages">): m is Doc<"messages"> =>
            m.role === "assistant" &&
            m.content.some(
              (c: any) => c.type === "text" && c.text.length > 0,
            ),
        );
        const lastAssistantMessage =
          assistantMessages[assistantMessages.length - 1];

        if (
          lastAssistantMessage &&
          lastAssistantMessage._creationTime > (lastMessage.createdAt?.getTime() ?? 0)
        ) {
          const textPart = lastAssistantMessage.content.find(
            (c: any) => c.type === "text",
          );
          if (textPart && "text" in textPart) {
            yield { content: [{ type: "text", text: textPart.text }] };
          }
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    },
  };

  const runtime = useLocalRuntime(ConvexModelAdapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
} 