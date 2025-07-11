import { useContext } from "react";

import type { AuthQueryOptions } from "../../lib/auth-query-provider";
import { AuthQueryContext } from "../../lib/auth-query-provider";
import type { AuthClient } from "../../types/auth-core-types";
import { useAuthMutation } from "../shared/use-auth-mutation";

export function useDeleteApiKey<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AuthQueryOptions>) {
    const { listApiKeysKey: queryKey } = useContext(AuthQueryContext);

    return useAuthMutation({
        mutationFn: authClient.apiKey.delete,
        options,
        queryKey,
    });
}
