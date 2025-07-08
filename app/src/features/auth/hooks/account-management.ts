import type { AnyUseQueryOptions } from "@tanstack/react-query";
import { useContext } from "react";

import { AuthQueryContext, type AuthQueryOptions } from "../lib/auth-query-provider";
import type { AuthClient } from "@/lib/auth/client";

import { useAuthQuery } from "./shared/use-auth-query";
import { useAuthMutation } from "./shared/use-auth-mutation";

// Account Listing Hook
export function useListAccounts<TAuthClient extends AnyAuthClient>(authClient: TAuthClient, options?: Partial<AnyUseQueryOptions>) {
    const { listAccountsKey: queryKey } = useContext(AuthQueryContext);

    return useAuthQuery({
        authClient,
        queryKey,
        queryFn: authClient.listAccounts,
        options,
    });
}

// Account Unlinking Hook
export function useUnlinkAccount<TAuthClient extends AnyAuthClient>(authClient: TAuthClient, options?: AuthQueryOptions) {
    const { listAccountsKey: queryKey } = useContext(AuthQueryContext);

    return useAuthMutation({
        queryKey,
        mutationFn: authClient.unlinkAccount,
        options,
    });
}
