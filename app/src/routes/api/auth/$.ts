import { env } from "@/lib/env";
import { reactStartHandler } from "@/lib/auth/client";
import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/auth/$").methods({
    GET: ({ request }) => {
        return reactStartHandler(request, {
            convexSiteUrl: env.VITE_CONVEX_SITE_URL,
        });
    },
    POST: ({ request }) => {
        return reactStartHandler(request, {
            convexSiteUrl: env.VITE_CONVEX_SITE_URL,
        });
    },
});
