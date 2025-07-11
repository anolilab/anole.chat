import type { AnyUseQueryOptions } from "@tanstack/react-query";
import { useContext } from "react";

import type { AuthClient } from "@/lib/auth/client";

import type { AuthQueryOptions } from "../lib/auth-query-provider";
import { AuthQueryContext } from "../lib/auth-query-provider";
import { useAuthMutation } from "./shared/use-auth-mutation";
import { useAuthQuery } from "./shared/use-auth-query";

// API Key Creation Hook
export function useCreateApiKey<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AuthQueryOptions>) {
    const { listApiKeysKey: queryKey } = useContext(AuthQueryContext);

    return useAuthMutation({
        mutationFn: authClient.apiKey.create,
        options,
        queryKey,
    });
}

// API Key Deletion Hook
export function useDeleteApiKey<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AuthQueryOptions>) {
    const { listApiKeysKey: queryKey } = useContext(AuthQueryContext);

    return useAuthMutation({
        mutationFn: authClient.apiKey.delete,
        options,
        queryKey,
    });
}

// API Key Listing Hook
export function useListApiKeys<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AnyUseQueryOptions>) {
    const { listApiKeysKey: queryKey } = useContext(AuthQueryContext);

    return useAuthQuery({
        authClient,
        options,
        queryFn: authClient.apiKey.list,
        queryKey,
    });
}
