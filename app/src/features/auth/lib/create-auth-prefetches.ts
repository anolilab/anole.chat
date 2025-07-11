import type { AnyUseQueryOptions, QueryClient } from "@tanstack/react-query";

import type { AuthClient } from "@/lib/auth/client";

import type { AuthQueryOptions } from "./auth-query-provider";
import { defaultAuthQueryOptions } from "./auth-query-provider";
import { prefetchSession } from "./prefetch-session";

export function createAuthPrefetches<TAuthClient extends AnyAuthClient>(authClient: TAuthClient, queryOptions?: AuthQueryOptions) {
    return {
        prefetchSession: (queryClient: QueryClient, options?: Partial<AnyUseQueryOptions>) => prefetchSession(authClient, queryClient, { ...defaultAuthQueryOptions, ...queryOptions }, options),
    };
}
