"use client";

import type { AgentModel } from "@anole/convex/ai/lib/agents";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { AssistantMessageAccumulator, DataStreamDecoder } from "assistant-stream";
import { asAsyncIterableStream } from "assistant-stream/utils";
import { useCallback, useRef, useState } from "react";

import { generateId } from "../providers/types";
import AdaptiveThrottle from "./utils/adaptive-throttle";

interface UseStreamManagerProperties {
    jwtToken: string;
    model: AgentModel;
    onStreamError: (threadId: string, messageId: string, error: Error) => void;
    onStreamStart: (threadId: string, messageId: string) => void;
    onStreamSuccess: (threadId: string, messageId: string) => void;
    onStreamUpdate: (threadId: string, messageId: string, newContent: ThreadMessageLike["content"]) => void;
}

export const useStreamManager = ({ jwtToken, model, onStreamError, onStreamStart, onStreamSuccess, onStreamUpdate }: UseStreamManagerProperties) => {
    const [isRunning, setIsRunning] = useState(false);
    const abortControllerReference = useRef<AbortController | null>(null);
    const throttleReference = useRef(new AdaptiveThrottle());

    const streamMessage = useCallback(
        async (prompt: string, threadId: string, fileIds?: string[]) => {
            if (isRunning) {
                console.warn("Stream is already running.");

                return;
            }

            const abortController = new AbortController();

            abortControllerReference.current = abortController;
            setIsRunning(true);
            throttleReference.current.reset();

            const assistantMessageId = generateId();

            onStreamStart(threadId, assistantMessageId);

            try {
                const response = await fetch(`/convex-http/chat/stream`, {
                    body: JSON.stringify({
                        fileIds,
                        model,
                        prompt,
                        threadId,
                    }),
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${jwtToken}`,
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    const text = await response.text();

                    throw new Error(`HTTP error ${response.status}: ${text}`);
                }

                if (!response.body) {
                    throw new Error("Response body is null");
                }

                const stream = response.body.pipeThrough(new DataStreamDecoder()).pipeThrough(new AssistantMessageAccumulator());

                let lastText = "";

                for await (const message of asAsyncIterableStream(stream)) {
                    if (abortController.signal.aborted) break;

                    if (message.parts.length > 0 && message.parts[0].type === "text") {
                        const textPart = message.parts[0];

                        if ("text" in textPart && textPart.text !== lastText) {
                            lastText = textPart.text;
                            throttleReference.current.execute(() => {
                                onStreamUpdate(threadId, assistantMessageId, [{ text: lastText, type: "text" }]);
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
                abortControllerReference.current = null;
            }
        },
        [isRunning, jwtToken, model, onStreamStart, onStreamUpdate, onStreamError, onStreamSuccess],
    );

    const cancelStream = useCallback(() => {
        if (abortControllerReference.current) {
            abortControllerReference.current.abort();
        }
    }, []);

    return { cancelStream, isRunning, streamMessage };
};
