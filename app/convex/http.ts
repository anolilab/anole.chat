import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { streamHttpAction, improvePromptHttpAction } from "./chat/functions";
import { betterAuthComponent, createAuth } from "./auth";
import { httpAction } from "./_generated/server";
import { resend } from "./email/functions";
import type { ActionCtx } from "./_generated/server";

// Create Hono app with Convex context
const app: HonoWithConvex<ActionCtx> = new Hono();

// Add logging middleware for better debugging
app.use("*", logger((message) => {
    console.log(message);
}));

// Add CORS middleware - should be called before routes
app.use("*", cors({
    origin: "*",
    credentials: true,
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
}));

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
    const handler = httpAction(async (ctx, req) => {
        return await resend.handleResendEventWebhook(ctx, req);
    });
    return handler(c.env, c.req.raw);
});

// Example API endpoint demonstrating Hono's health check
app.get("/api/health", async (c) => {
    return c.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: "production"
    });
});

// Example endpoint with path parameters
app.get("/api/user/:userId", async (c) => {
    const userId = c.req.param("userId");

    // You could call a Convex query here
    // const user = await c.env.runQuery(api.users.get, { userId });

    return c.json({
        userId,
        message: `User ${userId} endpoint accessed via Hono routing`
    });
});

// Custom 404 response
app.notFound((c) => {
    return c.json({
        error: "Endpoint not found",
        path: c.req.path,
        method: c.req.method
    }, 404);
});

// Error handling
app.onError((error, c) => {
    console.error("HTTP Error:", error);
    return c.json({
        error: "Internal server error",
        message: error.message
    }, 500);
});

// Create the HTTP router with Hono integration
const http = new HttpRouterWithHono(app);

// Register Better Auth routes
betterAuthComponent.registerRoutes(http, createAuth);

export default http;
