import type { AnyUseQueryOptions } from "@tanstack/react-query";
import { useContext } from "react";

import { AuthQueryContext, type AuthQueryOptions } from "../lib/auth-query-provider";
import type { AuthClient } from "../types/auth-core-types";
import { useAuthQuery } from "./shared/use-auth-query";
import { useAuthMutation } from "./shared/use-auth-mutation";

// API Key Creation Hook
export function useCreateApiKey<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AuthQueryOptions>) {
    const { listApiKeysKey: queryKey } = useContext(AuthQueryContext);

    return useAuthMutation({
        queryKey,
        mutationFn: authClient.apiKey.create,
        options,
    });
}

// API Key Deletion Hook
export function useDeleteApiKey<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AuthQueryOptions>) {
    const { listApiKeysKey: queryKey } = useContext(AuthQueryContext);

    return useAuthMutation({
        queryKey,
        mutationFn: authClient.apiKey.delete,
        options,
    });
}

// API Key Listing Hook
export function useListApiKeys<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AnyUseQueryOptions>) {
    const { listApiKeysKey: queryKey } = useContext(AuthQueryContext);

    return useAuthQuery({
        authClient,
        queryKey,
        queryFn: authClient.apiKey.list,
        options,
    });
}
