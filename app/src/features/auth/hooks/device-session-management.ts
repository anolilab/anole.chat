import type { AnyUseQueryOptions } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";

import { AuthQueryContext, type AuthQueryOptions } from "../lib/auth-query-provider";
import type { AuthClient } from "@/lib/auth/client";
import { useAuthQuery } from "./shared/use-auth-query";
import { useAuthMutation } from "./shared/use-auth-mutation";
import { useOnMutateError } from "./shared/use-mutate-error";

// Device Session Listing Hook
export function useListDeviceSessions<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AnyUseQueryOptions>) {
    const { listDeviceSessionsKey: queryKey } = useContext(AuthQueryContext);

    return useAuthQuery({
        authClient,
        queryKey,
        queryFn: authClient.multiSession.listDeviceSessions,
        options,
    });
}

// Single Device Session Revocation Hook
export function useRevokeDeviceSession<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AuthQueryOptions>) {
    const { listDeviceSessionsKey: queryKey } = useContext(AuthQueryContext);

    return useAuthMutation({
        queryKey,
        mutationFn: authClient.multiSession.revoke,
        options,
    });
}

// All Device Sessions Revocation Hook
export function useRevokeDeviceSessions<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AuthQueryOptions>) {
    const { listDeviceSessionsKey: queryKey } = useContext(AuthQueryContext);

    return useAuthMutation({
        queryKey,
        mutationFn: authClient.revokeSessions,
        options,
    });
}

// Active Session Setting Hook
export function useSetActiveSession<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AuthQueryOptions>) {
    type SetActiveSessionParams = Parameters<TAuthClient["multiSession"]["setActive"]>[0];

    const queryClient = useQueryClient();
    const { onMutateError } = useOnMutateError();
    const context = useContext(AuthQueryContext);
    const { listDeviceSessionsKey: queryKey } = { ...context, ...options };

    const mutation = useMutation({
        mutationFn: ({ fetchOptions = { throw: true }, ...params }: SetActiveSessionParams) => authClient.multiSession.setActive({ fetchOptions, ...params }),
        onError: (error) => onMutateError(error, queryKey),
        onSettled: () => queryClient.clear(),
    });

    const { mutate: setActiveSession, mutateAsync: setActiveSessionAsync, isPending: setActiveSessionPending, error: setActiveSessionError } = mutation;

    return {
        ...mutation,
        setActiveSession,
        setActiveSessionAsync,
        setActiveSessionPending,
        setActiveSessionError,
    };
}
