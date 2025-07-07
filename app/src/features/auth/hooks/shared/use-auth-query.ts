import { type QueryKey, skipToken } from "@tanstack/query-core";
import { type AnyUseQueryOptions, useQuery } from "@tanstack/react-query";
import type { BetterFetchOption, BetterFetchResponse } from "better-auth/react";
import { useContext } from "react";

import { AuthQueryContext } from "../../lib/auth-query-provider";
import type { AnyAuthClient } from "../../types/auth-core-types";
import { useSession } from "../session-user-management";

export type BetterFetchRequest<TData> = ({ fetchOptions }: { fetchOptions: BetterFetchOption }) => Promise<BetterFetchResponse<TData>>;

type UseAuthQueryProps<TData, TAuthClient> = {
    authClient: TAuthClient;
    queryKey: QueryKey;
    queryFn: BetterFetchRequest<TData>;
    options?: Partial<AnyUseQueryOptions>;
};

export function useAuthQuery<TData, TAuthClient extends AnyAuthClient = AnyAuthClient>({
    authClient,
    queryKey,
    queryFn,
    options,
}: UseAuthQueryProps<TData, TAuthClient>) {
    const { data: sessionData } = useSession(authClient);
    const { queryOptions } = useContext(AuthQueryContext);
    const mergedOptions = { ...queryOptions, ...options };

    return useQuery<TData>({
        queryKey,
        queryFn: sessionData ? () => queryFn({ fetchOptions: { throw: true } }) : skipToken,
        ...mergedOptions,
    });
}
