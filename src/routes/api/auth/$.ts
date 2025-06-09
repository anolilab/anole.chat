import { betterAuth } from "@/lib/auth/server";
import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/auth/$").methods({
    GET: ({ request }) => {
        return betterAuth.handler(request);
    },
    POST: ({ request }) => {
        return betterAuth.handler(request);
    },
});
