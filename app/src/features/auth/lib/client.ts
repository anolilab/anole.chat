import { env } from "@/lib/env";
import {
    anonymousClient,
    jwtClient,
    oidcClient,
    adminClient,
    emailOTPClient,
    magicLinkClient,
    organizationClient,
    passkeyClient,
    twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: env.VITE_SITE_URL,
    plugins: [twoFactorClient(), emailOTPClient(), magicLinkClient(), convexClient(), organizationClient()],
});

export type AuthClient = ReturnType<typeof createAuthClient>;
