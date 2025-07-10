import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { streamHttpAction, improvePromptHttpAction } from "./chat/functions";
import { createAuth } from "./auth";
import { requestId } from "hono/request-id";
import { resend } from "./email/functions";
import type { ActionCtx } from "./_generated/server";
import { CONVEX_SITE_URL } from "./env";

const app: HonoWithConvex<ActionCtx> = new Hono();

// Add logging middleware for better debugging
app.use(
    "*",
    logger((message) => {
        console.log(message);
    }),
);
app.use("*", requestId());
app.use(
    "*",
    cors({
        origin: "*",
        credentials: true,
        allowHeaders: ["Authorization", "Content-Type", "Better-Auth-Cookie"],
        allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
        exposeHeaders: ["Content-Length", "Set-Better-Auth-Cookie"],
        maxAge: 600,
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
app.post("/chat/stream", async (c) => {
    return streamHttpAction(c.env, c.req.raw);
});

// Prompt improvement endpoint
app.post("/chat/improve-prompt", async (c) => {
    return improvePromptHttpAction(c.env, c.req.raw);
});

// Email webhook endpoint
app.post("/email/resend/webhook", async (c) => {
    return await resend.handleResendEventWebhook(c.env, c.req.raw);
});

// Example API endpoint demonstrating Hono's health check
app.get("/api/health", async (c) => {
    return c.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: "production",
    });
});

app.notFound((c) => {
    return c.json(
        {
            error: "Endpoint not found",
            path: c.req.path,
            method: c.req.method,
        },
        404,
    );
});

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
