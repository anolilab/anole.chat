import { httpRouter } from "convex/server";
import { corsRouter } from "convex-helpers/server/cors";
import { streamHttpAction, improvePromptHttpAction } from "./chat/functions";

const http = httpRouter();

const cors = corsRouter(http, {
    allowCredentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
});

cors.route({
    path: "/chat/stream",
    method: "POST",
    handler: streamHttpAction,
});

cors.route({
    path: "/chat/improve-prompt",
    method: "POST",
    handler: improvePromptHttpAction,
});

export default http;
