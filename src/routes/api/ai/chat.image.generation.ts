import { openai } from "@ai-sdk/openai";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { type Message, experimental_generateImage as generateImage, streamText, tool } from "ai";
import { z } from "zod";

export const ServerRoute = createServerFileRoute("/api/ai/chat/image/generation").methods({
    POST: async ({ request }) => {
        const { messages }: { messages: Message[] } = await request.json();

        // filter through messages and remove base64 image data to avoid sending to the model
        const formattedMessages = messages.map((m) => {
            if (m.role === "assistant" && m.parts && m.parts.length > 0) {
                // biome-ignore lint/complexity/noForEach: <explanation>
                m.parts.forEach((part) => {
                    if (part.type === "tool-invocation" && part.toolInvocation.toolName === "generateImage" && part.toolInvocation.state === "result") {
                        // biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
                        part.toolInvocation.result.image = `redacted-for-length`;
                    }
                });
            }
            return m;
        });

        const result = streamText({
            model: openai("gpt-4o"),
            messages: formattedMessages,
            tools: {
                generateImage: tool({
                    description: "Generate an image",
                    parameters: z.object({
                        prompt: z.string().describe("The prompt to generate the image from"),
                    }),
                    execute: async ({ prompt }) => {
                        const { image } = await generateImage({
                            model: openai.image("gpt-image-1"),
                            prompt,
                        });
                        // in production, save this image to blob storage and return a URL
                        return { image: image.base64, prompt };
                    },
                }),
            },
        });
        return result.toDataStreamResponse();
    },
});
