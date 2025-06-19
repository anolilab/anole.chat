"use client";

import { useCallback, useRef, useState } from "react";
import { asAsyncIterableStream } from "assistant-stream/utils";
import {
  AssistantMessageAccumulator,
  DataStreamDecoder,
} from "assistant-stream";
import type { ThreadMessageLike } from "@assistant-ui/react";
import type { AgentModel } from "@cvx/ai/lib/agents";
import { generateId } from "../providers/types";
import { AdaptiveThrottle } from "../providers/streaming-optimizations";

interface UseStreamManagerProps {
  model: AgentModel;
  jwtToken: string;
  onStreamStart: (threadId: string, messageId: string) => void;
  onStreamUpdate: (
    threadId: string,
    messageId: string,
    newContent: ThreadMessageLike["content"],
  ) => void;
  onStreamError: (
    threadId: string,
    messageId: string,
    error: Error,
  ) => void;
  onStreamSuccess: (threadId: string, messageId: string) => void;
}

export const useStreamManager = ({
  model,
  jwtToken,
  onStreamStart,
  onStreamUpdate,
  onStreamError,
  onStreamSuccess,
}: UseStreamManagerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const throttleRef = useRef(new AdaptiveThrottle());

  const streamMessage = useCallback(
    async (prompt: string, threadId: string, fileIds?: string[]) => {
      if (isRunning) {
        console.warn("Stream is already running.");
        return;
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setIsRunning(true);
      throttleRef.current.reset();

      const assistantMessageId = generateId();
      onStreamStart(threadId, assistantMessageId);

      try {
        const response = await fetch(`/convex-http/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          credentials: "include",
          body: JSON.stringify({
            prompt: prompt,
            threadId: threadId,
            model,
            fileIds,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP error ${response.status}: ${text}`);
        }

        if (!response.body) {
          throw new Error("Response body is null");
        }

        const stream = response.body
          .pipeThrough(new DataStreamDecoder())
          .pipeThrough(new AssistantMessageAccumulator());

        let lastText = "";

        for await (const message of asAsyncIterableStream(stream)) {
          if (abortController.signal.aborted) break;

          if (message.parts.length > 0 && message.parts[0].type === "text") {
            const textPart = message.parts[0];
            if ("text" in textPart && textPart.text !== lastText) {
              lastText = textPart.text;
              throttleRef.current.execute(() => {
                onStreamUpdate(threadId, assistantMessageId, [
                  { type: "text", text: lastText },
                ]);
              });
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("Stream aborted by user.");
        } else {
          console.error("Stream error:", error);
          onStreamError(threadId, assistantMessageId, error as Error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          onStreamSuccess(threadId, assistantMessageId);
        }
        setIsRunning(false);
        abortControllerRef.current = null;
      }
    },
    [
      isRunning,
      jwtToken,
      model,
      onStreamStart,
      onStreamUpdate,
      onStreamError,
      onStreamSuccess,
    ],
  );

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return { streamMessage, cancelStream, isRunning };
};
