import { httpRouter } from "convex/server";
import { corsRouter } from "convex-helpers/server/cors";
import { streamHttpAction, improvePromptHttpAction } from "./chat/functions";
import { betterAuthComponent, createAuth } from "./auth";
import { httpAction } from "./_generated/server";
import { resend } from "./email/functions";

const http = httpRouter();

betterAuthComponent.registerRoutes(http, createAuth);

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

cors.route({
    path: "/email/resend/webhook",
    method: "POST",
    handler: httpAction(async (ctx, req) => {
        return await resend.handleResendEventWebhook(ctx, req);
    }),
});

export default http;
