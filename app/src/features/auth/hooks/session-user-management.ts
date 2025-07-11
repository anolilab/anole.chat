import type { AnyUseQueryOptions } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";

import type { AuthClient } from "@/lib/auth/client";

import type { AuthQueryOptions } from "../lib/auth-query-provider";
import { AuthQueryContext } from "../lib/auth-query-provider";
import type { AnyAuthClient } from "../types/auth-core-types";
import { useAuthMutation } from "./shared/use-auth-mutation";

// Session Management Hook
export function useSession<TAuthClient extends AnyAuthClient>(authClient: TAuthClient, options?: Partial<AnyUseQueryOptions>) {
    type SessionData = TAuthClient["$Infer"]["Session"];
    type User = TAuthClient["$Infer"]["Session"]["user"];
    type Session = TAuthClient["$Infer"]["Session"]["session"];

    const { queryOptions, sessionKey: queryKey, sessionQueryOptions } = useContext(AuthQueryContext);
    const mergedOptions = { ...queryOptions, ...sessionQueryOptions, ...options };

    const result = useQuery<SessionData>({
        queryFn: () => (authClient as AuthClient).getSession({ fetchOptions: { throw: true } }),
        queryKey,
        ...mergedOptions,
    });

    const session = result.data?.session as Session | undefined;
    const user = result.data?.user as User | undefined;

    if (user) {
        user.createdAt = new Date(user.createdAt);
        user.updatedAt = new Date(user.updatedAt);
    }

    if (session) {
        session.createdAt = new Date(session.createdAt);
        session.updatedAt = new Date(session.updatedAt);
        session.expiresAt = new Date(session.expiresAt);
    }

    return {
        ...result,
        session,
        user,
    };
}

// User Update Hook
export function useUpdateUser<TAuthClient extends AnyAuthClient>(authClient: TAuthClient, options?: Partial<AuthQueryOptions>) {
    type SessionData = TAuthClient["$Infer"]["Session"];

    const { sessionKey: queryKey } = useContext(AuthQueryContext);

    return useAuthMutation({
        mutationFn: authClient.updateUser,
        optimisticData: (parameters, previousSession: SessionData) => {
            return {
                ...previousSession,
                user: { ...previousSession.user, ...parameters },
            };
        },
        options,
        queryKey,
    });
}
