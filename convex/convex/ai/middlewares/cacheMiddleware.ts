import type { LanguageModelV1Middleware, LanguageModelV1StreamPart } from "ai";
import { simulateReadableStream } from "ai";

import { components } from "../../_generated/api";
import type { ActionCtx as ActionContext } from "../../_generated/server";

const ONE_HOUR_IN_MS = 1000 * 60 * 60;

const createCacheMiddleware = (name: string, context: ActionContext) => {
    name = `cached-${name}`;

    return {
        wrapGenerate: async ({ doGenerate, params }) => {
            const cacheKey = JSON.stringify(params);
            const ttl = ONE_HOUR_IN_MS;
            const cacheName = `${name}-generate`;

            const cached = await context.runQuery(components.actionCache.lib.get, {
                args: cacheKey,
                name: cacheName,
                ttl,
            });

            if (cached.kind === "hit" && cached.value) {
                const result = cached.value as Awaited<ReturnType<typeof doGenerate>>;

                if (result.response?.timestamp && typeof result.response.timestamp === "string") {
                    result.response.timestamp = new Date(result.response.timestamp);
                }

                return result;
            }

            const result = await doGenerate();

            await context.runMutation(components.actionCache.lib.put, {
                args: cacheKey,
                expiredEntry: undefined,
                name: cacheName,
                ttl,
                value: result,
            });

            return result;
        },
        wrapStream: async ({ doStream, params }) => {
            const cacheKey = JSON.stringify(params);
            const ttl = ONE_HOUR_IN_MS;
            const cacheName = `${name}-stream`;

            const cached = await context.runQuery(components.actionCache.lib.get, {
                args: cacheKey,
                name: cacheName,
                ttl,
            });

            if (cached.kind === "hit" && cached.value) {
                const formattedChunks = (cached.value as LanguageModelV1StreamPart[]).map((p) => {
                    if (p.type === "response-metadata" && p.timestamp) {
                        return { ...p, timestamp: new Date(p.timestamp) };
                    }

                    return p;
                });

                return {
                    rawCall: { rawPrompt: null, rawSettings: {} },
                    stream: simulateReadableStream({
                        chunkDelayInMs: 2,
                        chunks: formattedChunks,
                        initialDelayInMs: 0,
                    }),
                };
            }

            const { stream, ...rest } = await doStream();

            const fullResponse: LanguageModelV1StreamPart[] = [];

            const transformStream = new TransformStream<LanguageModelV1StreamPart, LanguageModelV1StreamPart>({
                flush() {
                    void context.runMutation(components.actionCache.lib.put, {
                        args: cacheKey,
                        expiredEntry: undefined,
                        name: cacheName,
                        ttl,
                        value: fullResponse,
                    });
                },
                transform(chunk, controller) {
                    fullResponse.push(chunk);
                    controller.enqueue(chunk);
                },
            });

            return {
                stream: stream.pipeThrough(transformStream),
                ...rest,
            };
        },
    } satisfies LanguageModelV1Middleware;
};

export default createCacheMiddleware;
