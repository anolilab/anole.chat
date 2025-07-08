import type { AnyUseQueryOptions } from "@tanstack/react-query";
import { useContext } from "react";

import { AuthQueryContext, type AuthQueryOptions } from "../lib/auth-query-provider";
import type { AuthClient } from "@/lib/auth/client";

import { useAuthQuery } from "./shared/use-auth-query";
import { useAuthMutation } from "./shared/use-auth-mutation";

// Session Listing Hook
export function useListSessions<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AnyUseQueryOptions>) {
    const { listSessionsKey: queryKey } = useContext(AuthQueryContext);
    return useAuthQuery({ authClient, queryKey, queryFn: authClient.listSessions, options });
}

// All Sessions Revocation Hook
export function useRevokeSessions<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AuthQueryOptions>) {
    const { listSessionsKey: queryKey } = useContext(AuthQueryContext);

    return useAuthMutation({
        queryKey,
        mutationFn: authClient.revokeSessions,
        options,
    });
}

// Single Session Revocation Hook
export function useRevokeSession<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AuthQueryOptions>) {
    const { listSessionsKey: queryKey } = useContext(AuthQueryContext);

    return useAuthMutation({
        queryKey,
        mutationFn: authClient.revokeSession,
        options,
    });
}

// Other Sessions Revocation Hook
export function useRevokeOtherSessions<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AuthQueryOptions>) {
    const { listSessionsKey: queryKey } = useContext(AuthQueryContext);

    return useAuthMutation({
        queryKey,
        mutationFn: authClient.revokeOtherSessions,
        options,
    });
}
