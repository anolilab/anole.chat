import { env } from "@/lib/env.client";
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
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { useCallback } from "react";
import { getConvexToken } from "@/lib/auth/get-convex-token";
import type { ConvexProviderWithAuth } from "convex/react";
import { betterAuth } from "@/lib/auth/server";

export const authClient = createAuthClient({
    baseURL: env.VITE_SERVER_URL,
    plugins: [
        anonymousClient(),
        jwtClient(),
        oidcClient(),
        twoFactorClient(),
        passkeyClient(),
        adminClient(),
        organizationClient(),
        emailOTPClient(),
        magicLinkClient(),
    ],
});

export const sessionQueryOptions = queryOptions({
    queryKey: ["session"],
    queryFn: async () => {
      const session = await authClient.getSession();
      return session.data;
    },
  });

export const jwtQueryOptions = queryOptions({
    queryKey: ["jwt"],
    queryFn: async () => {
        const jwt = await getConvexToken();

        if ("error" in jwt) {
            throw new Error(jwt.error);
        }

        return jwt.data;
    },
});

export const getServerSession = createServerFn({ method: "GET" }).handler(async () => {
    const session = await betterAuth.api.getSession({
        headers: getWebRequest()?.headers ?? new Headers(),
    });
    return session;
});

export function useAuthForConvex(): ReturnType<React.ComponentProps<typeof ConvexProviderWithAuth>["useAuth"]> {
    const queryClient = useQueryClient();
    const sessionQuery = useQuery(sessionQueryOptions);
    const jwtQuery = useQuery(jwtQueryOptions);

    const fetchAccessToken = useCallback(
        async (args: { forceRefreshToken: boolean }) => {
            if (!sessionQuery.data) return null;

            if (args.forceRefreshToken) {
                return queryClient.fetchQuery(jwtQueryOptions);
            }
            return queryClient.ensureQueryData(jwtQueryOptions);
        },
        [queryClient, sessionQuery.data],
    );

    return {
        isLoading: sessionQuery.isPending || jwtQuery.isPending,
        isAuthenticated: sessionQuery.data !== null,
        fetchAccessToken,
    };
}

export type AuthClient = ReturnType<typeof createAuthClient>;
