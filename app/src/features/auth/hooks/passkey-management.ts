import type { AnyUseQueryOptions } from "@tanstack/react-query";
import { useContext } from "react";

import { AuthQueryContext, type AuthQueryOptions } from "../lib/auth-query-provider";
import type { AuthClient } from "../types/auth-core-types";
import { useAuthQuery } from "./shared/use-auth-query";
import { useAuthMutation } from "./shared/use-auth-mutation";

// Passkey Deletion Hook
export function useDeletePasskey<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AuthQueryOptions>) {
    const { listPasskeysKey: queryKey } = useContext(AuthQueryContext);

    return useAuthMutation({
        queryKey,
        mutationFn: authClient.passkey.deletePasskey,
        options,
    });
}

// Passkey Listing Hook
export function useListPasskeys<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AnyUseQueryOptions>) {
    const { listPasskeysKey: queryKey } = useContext(AuthQueryContext);

    return useAuthQuery({
        authClient,
        queryKey,
        queryFn: authClient.passkey.listUserPasskeys,
        options,
    });
}
