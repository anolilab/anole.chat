import { createAuthClient } from "better-auth/client"
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
import { env } from "../env"
import { createAuth } from "convex/auth";
import { reactStartHelpers } from "@convex-dev/better-auth/react-start";

export const authClient = createAuthClient({
    baseURL: env.VITE_SITE_URL,
    plugins: [twoFactorClient(), emailOTPClient(), magicLinkClient(), organizationClient(), convexClient()],

})

export type AuthClient = typeof authClient

export const { fetchSession, reactStartHandler, getCookieName } =
  reactStartHelpers(createAuth, {
    convexSiteUrl: env.VITE_CONVEX_SITE_URL,
  })