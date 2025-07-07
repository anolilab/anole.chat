import { createAuthClient } from "better-auth/react";
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
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { env } from "../env";

export const authClient = createAuthClient({
    baseURL: env.VITE_SITE_URL,
    plugins: [twoFactorClient(), emailOTPClient(), magicLinkClient(), organizationClient(), convexClient()],
});

export type AuthClient = typeof authClient;
