import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import crypto from "crypto";

export const polarWebhook = httpAction({
    args: {},
    returns: v.null(),
    handler: async (ctx, request) => {
        const body = await request.text();
        const signature = request.headers.get("polar-signature");

        if (!signature) {
            return new Response("Missing signature", { status: 400 });
        }

        // Verify webhook signature
        const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error("POLAR_WEBHOOK_SECRET not configured");
            return new Response("Webhook secret not configured", { status: 500 });
        }

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(body)
            .digest("hex");

        if (signature !== expectedSignature) {
            console.error("Invalid webhook signature");
            return new Response("Invalid signature", { status: 401 });
        }

        try {
            const event = JSON.parse(body);
            
            // Process the webhook event
            await ctx.runMutation(internal.polar.processWebhook, {
                eventId: event.id,
                eventType: event.type,
                eventData: body,
            });

            return new Response("OK", { status: 200 });
        } catch (error) {
            console.error("Error processing webhook:", error);
            return new Response("Error processing webhook", { status: 500 });
        }
    },
});