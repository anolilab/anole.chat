import type { AnyUseQueryOptions } from "@tanstack/react-query";
import { useContext } from "react";

import type { AuthClient } from "@/lib/auth/client";

import type { AuthQueryOptions } from "../lib/auth-query-provider";
import { AuthQueryContext } from "../lib/auth-query-provider";
import { useAuthMutation } from "./shared/use-auth-mutation";
import { useAuthQuery } from "./shared/use-auth-query";

// Passkey Deletion Hook
export function useDeletePasskey<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AuthQueryOptions>) {
    const { listPasskeysKey: queryKey } = useContext(AuthQueryContext);

    return useAuthMutation({
        mutationFn: authClient.passkey.deletePasskey,
        options,
        queryKey,
    });
}

// Passkey Listing Hook
export function useListPasskeys<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AnyUseQueryOptions>) {
    const { listPasskeysKey: queryKey } = useContext(AuthQueryContext);

    return useAuthQuery({
        authClient,
        options,
        queryFn: authClient.passkey.listUserPasskeys,
        queryKey,
    });
}
