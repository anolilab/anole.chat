import { httpRouter } from "convex/server";
import { corsRouter } from "convex-helpers/server/cors";
import { streamHttpAction } from "./chat";

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

export default http;
