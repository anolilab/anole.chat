import type { HonoWithConvex } from "convex-helpers/server/hono";
import { HttpRouterWithHono } from "convex-helpers/server/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";

import type { ActionCtx as ActionContext } from "./_generated/server";
import { createAuth } from "./auth";
import { improvePromptHttpAction, streamHttpAction } from "./chat/http";
import { resend } from "./email/functions";
import { polarWebhook } from "./polar/webhook";
import { CONVEX_SITE_URL } from "./env";

const app: HonoWithConvex<ActionContext> = new Hono();

// Add logging middleware for better debugging
app.use(
    "*",
    logger((message) => {
        // eslint-disable-next-line no-console
        console.log(message);
    }),
);
app.use("*", requestId());
app.use(
    "*",
    cors({
        allowHeaders: ["Authorization", "Content-Type", "Better-Auth-Cookie"],
        allowMethods: [
            "GET",
            "HEAD",
            "PUT",
            "POST",
            "DELETE",
            "PATCH",
            "OPTIONS",
        ],
        credentials: true,
        exposeHeaders: ["Content-Length", "Set-Better-Auth-Cookie"],
        maxAge: 600,
        origin: "*",
    }),
);

const authRequestHandler = async (c: any) => {
    const auth = createAuth(c.env);
    const response = await auth.handler(c.req.raw);

    return response;
};

// Better Auth routes implemented in Hono
const authPath = "/api/auth";

// OpenID configuration redirect
app.get("/.well-known/openid-configuration", async (c) => {
    // Since we're in an HTTP action context, we can access environment variables
    const url = `${CONVEX_SITE_URL}/api/auth/convex/.well-known/openid-configuration`;

    return Response.redirect(url);
});

// General auth routes (GET)
app.get(`${authPath}/*`, authRequestHandler);

// General auth routes (POST)
app.post(`${authPath}/*`, authRequestHandler);

// Chat streaming endpoint
app.post("/chat/stream", async (c) => streamHttpAction(c.env, c.req.raw));

// Prompt improvement endpoint
app.post("/chat/improve-prompt", async (c) =>
    improvePromptHttpAction(c.env, c.req.raw));

// Email webhook endpoint
app.post(
    "/email/resend/webhook",
    async (c) => await resend.handleResendEventWebhook(c.env, c.req.raw),
);

// Polar webhook endpoint
app.post("/webhooks/polar", async (c) => await polarWebhook(c.env, c.req.raw));

// Example API endpoint demonstrating Hono's health check
app.get("/api/health", async (c) =>
    c.json({
        environment: "production",
        status: "ok",
        timestamp: new Date().toISOString(),
    }));

app.notFound((c) =>
    c.json(
        {
            error: "Endpoint not found",
            method: c.req.method,
            path: c.req.path,
        },
        404,
    ),
);

// Error handling
app.onError((error, c) => {
    console.error("HTTP Error:", error);

    return c.json(
        {
            error: "Internal server error",
            message: error.message,
        },
        500,
    );
});

export default new HttpRouterWithHono(app);
