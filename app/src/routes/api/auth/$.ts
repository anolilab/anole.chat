import { reactStartHandler } from "@convex-dev/better-auth/react-start";
import { createServerFileRoute } from "@tanstack/react-start/server";

import { env } from "@/lib/env";

export const ServerRoute = createServerFileRoute("/api/auth/$").methods({
    GET: ({ request }) => reactStartHandler(request, {
        convexSiteUrl: env.VITE_CONVEX_SITE_URL,
    }),
    POST: ({ request }) => reactStartHandler(request, {
        convexSiteUrl: env.VITE_CONVEX_SITE_URL,
    }),
});
