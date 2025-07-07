import { type AnyUseQueryOptions, useQuery } from "@tanstack/react-query"
import { useContext } from "react"

import { AuthQueryContext, type AuthQueryOptions } from "../lib/auth-query-provider"
import type { AnyAuthClient, AuthClient } from "../types/auth-core-types"
import { useAuthMutation } from "./shared/use-auth-mutation"

// Session Management Hook
export function useSession<TAuthClient extends AnyAuthClient>(
    authClient: TAuthClient,
    options?: Partial<AnyUseQueryOptions>
) {
    type SessionData = TAuthClient["$Infer"]["Session"]
    type User = TAuthClient["$Infer"]["Session"]["user"]
    type Session = TAuthClient["$Infer"]["Session"]["session"]

    const { sessionQueryOptions, sessionKey: queryKey, queryOptions } = useContext(AuthQueryContext)
    const mergedOptions = { ...queryOptions, ...sessionQueryOptions, ...options }

    const result = useQuery<SessionData>({
        queryKey,
        queryFn: () => (authClient as AuthClient).getSession({ fetchOptions: { throw: true } }),
        ...mergedOptions
    })

    return {
        ...result,
        session: result.data?.session as Session | undefined,
        user: result.data?.user as User | undefined
    }
}

// User Update Hook
export function useUpdateUser<TAuthClient extends AnyAuthClient>(
    authClient: TAuthClient,
    options?: Partial<AuthQueryOptions>
) {
    type SessionData = TAuthClient["$Infer"]["Session"]

    const { sessionKey: queryKey } = useContext(AuthQueryContext)

    return useAuthMutation({
        queryKey,
        mutationFn: authClient.updateUser,
        optimisticData: (params, previousSession: SessionData) => ({
            ...previousSession,
            user: { ...previousSession.user, ...params }
        }),
        options
    })
} 