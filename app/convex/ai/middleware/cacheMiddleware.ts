import { LanguageModelV1Middleware, LanguageModelV1StreamPart, simulateReadableStream } from "ai";
import { components } from "../../_generated/api";
import { ActionCtx } from "../../_generated/server";

const ONE_HOUR_IN_MS = 1000 * 60 * 60;

const createCacheMiddleware = (name: string, ctx: ActionCtx) => {
    name = `cached-${name}`;

    return {
        wrapGenerate: async ({ params, doGenerate }) => {
            const cacheKey = JSON.stringify(params);
            const ttl = ONE_HOUR_IN_MS;
            const cacheName = `${name}-generate`;

            const cached = await ctx.runQuery(components.actionCache.lib.get, {
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

            await ctx.runMutation(components.actionCache.lib.put, {
                args: cacheKey,
                value: result,
                ttl,
                expiredEntry: undefined,
                name: cacheName,
            });

            return result;
        },
        wrapStream: async ({ doStream, params }) => {
            const cacheKey = JSON.stringify(params);
            const ttl = ONE_HOUR_IN_MS;
            const cacheName = `${name}-stream`;

            const cached = await ctx.runQuery(components.actionCache.lib.get, {
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
                    stream: simulateReadableStream({
                        chunks: formattedChunks,
                    }),
                    rawCall: { rawPrompt: null, rawSettings: {} },
                };
            }

            const { stream, ...rest } = await doStream();

            const fullResponse: LanguageModelV1StreamPart[] = [];

            const transformStream = new TransformStream<LanguageModelV1StreamPart, LanguageModelV1StreamPart>({
                transform(chunk, controller) {
                    fullResponse.push(chunk);
                    controller.enqueue(chunk);
                },
                flush() {
                    void ctx.runMutation(components.actionCache.lib.put, {
                        args: cacheKey,
                        value: fullResponse,
                        ttl,
                        expiredEntry: undefined,
                        name: cacheName,
                    });
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
