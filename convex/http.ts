import { httpRouter } from "convex/server";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { SITE_URL } from "./env";
import { corsRouter, DEFAULT_EXPOSED_HEADERS } from "convex-helpers/server/cors";

const http = httpRouter();

const cors = corsRouter(http, {
    allowCredentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
});

cors.route({
    path: "/chat/message",
    method: "POST",
    handler: httpAction(async ({ runMutation }, req) => {
        console.log(await req.json());
        const { prompt, threadId, model } = await req.json();

        const result = await runMutation(api.chat.sendMessage, {
            prompt,
            threadId,
            model,
        });

        return new Response(result, {
            status: 200,
            headers: new Headers({
                "Access-Control-Allow-Origin": SITE_URL,
                Vary: "origin",
            }),
        });
    }),
    exposedHeaders: [...DEFAULT_EXPOSED_HEADERS, "Message-Id"],
});

export default http;
