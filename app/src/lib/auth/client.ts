import { convexClient } from "@convex-dev/better-auth/client/plugins";
import {
    adminClient,
    anonymousClient,
    emailOTPClient,
    jwtClient,
    magicLinkClient,
    oidcClient,
    organizationClient,
    passkeyClient,
    twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { env as environment } from "../env";

export const authClient = createAuthClient({
    baseURL: environment.VITE_SITE_URL,
    plugins: [anonymousClient(), adminClient(), twoFactorClient(), emailOTPClient(), magicLinkClient(), organizationClient(), convexClient()],
});

export type AuthClient = typeof authClient;
