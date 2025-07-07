import type { AnyUseQueryOptions, QueryKey } from "@tanstack/react-query"
import { useQueryClient } from "@tanstack/react-query"
import { useContext } from "react"

import { useListAccounts, useUnlinkAccount } from "../hooks/account-management"
import { useCreateApiKey, useDeleteApiKey, useListApiKeys } from "../hooks/api-key-management"
import { useListDeviceSessions, useRevokeDeviceSession, useRevokeDeviceSessions, useSetActiveSession } from "../hooks/device-session-management"
import { useActiveOrganization, useHasPermission, useInvitation, useListOrganizations } from "../hooks/organization-management"
import { useDeletePasskey, useListPasskeys } from "../hooks/passkey-management"
import { useSession, useUpdateUser } from "../hooks/session-user-management"
import { useListSessions, useRevokeOtherSessions, useRevokeSession, useRevokeSessions } from "../hooks/session-management"
import { useAuthMutation } from "../hooks/shared/use-auth-mutation"
import { type BetterFetchRequest, useAuthQuery } from "../hooks/shared/use-auth-query"
import { useToken } from "../hooks/token/use-token"
import type { AnyAuthClient, AuthClient } from "../types/auth-core-types"
import { AuthQueryContext, type AuthQueryOptions } from "./auth-query-provider"
import { prefetchSession } from "./prefetch-session"

export function createAuthHooks<TAuthClient extends AnyAuthClient>(authClient: TAuthClient) {
    return {
        useSession: (options?: Partial<AnyUseQueryOptions>) => useSession(authClient, options),
        usePrefetchSession: (options?: Partial<AnyUseQueryOptions>) => {
            const queryClient = useQueryClient()
            const queryOptions = useContext(AuthQueryContext)

            return {
                prefetch: () => prefetchSession(authClient, queryClient, queryOptions, options)
            }
        },
        useUpdateUser: (options?: Partial<AuthQueryOptions>) => useUpdateUser(authClient, options),
        useToken: (options?: Partial<AnyUseQueryOptions>) => useToken(authClient, options),
        useAuthQuery: <TData>({
            queryKey,
            queryFn,
            options
        }: {
            queryKey: QueryKey
            queryFn: BetterFetchRequest<TData>
            options?: Partial<AnyUseQueryOptions>
        }) => useAuthQuery({ authClient, queryKey, queryFn, options }),
        useListAccounts: (options?: Partial<AnyUseQueryOptions>) =>
            useListAccounts(authClient, options),
        useUnlinkAccount: () => useUnlinkAccount(authClient),
        useListSessions: (options?: Partial<AnyUseQueryOptions>) =>
            useListSessions(authClient, options),
        useRevokeSession: (options?: Partial<AuthQueryOptions>) =>
            useRevokeSession(authClient, options),
        useRevokeSessions: (options?: Partial<AuthQueryOptions>) =>
            useRevokeSessions(authClient, options),
        useRevokeOtherSessions: (options?: Partial<AuthQueryOptions>) =>
            useRevokeOtherSessions(authClient, options),
        useListDeviceSessions: (options?: Partial<AnyUseQueryOptions>) =>
            useListDeviceSessions(authClient as AuthClient, options),
        useRevokeDeviceSession: (options?: Partial<AuthQueryOptions>) =>
            useRevokeDeviceSession(authClient as AuthClient, options),
        useSetActiveSession: (options?: Partial<AuthQueryOptions>) =>
            useSetActiveSession(authClient as AuthClient, options),
        useListPasskeys: (options?: Partial<AnyUseQueryOptions>) =>
            useListPasskeys(authClient as AuthClient, options),
        useDeletePasskey: (options?: Partial<AuthQueryOptions>) =>
            useDeletePasskey(authClient as AuthClient, options),
        useListApiKeys: (options?: Partial<AnyUseQueryOptions>) =>
            useListApiKeys(authClient as AuthClient, options),
        useCreateApiKey: (options?: Partial<AuthQueryOptions>) =>
            useCreateApiKey(authClient as AuthClient, options),
        useDeleteApiKey: (options?: Partial<AuthQueryOptions>) =>
            useDeleteApiKey(authClient as AuthClient, options),
        useActiveOrganization: (options?: Partial<AnyUseQueryOptions>) =>
            useActiveOrganization(authClient as AuthClient, options),
        useListOrganizations: (options?: Partial<AnyUseQueryOptions>) =>
            useListOrganizations(authClient as AuthClient, options),
        useHasPermission: (
            params: Parameters<AuthClient["organization"]["hasPermission"]>[0],
            options?: Partial<AnyUseQueryOptions>
        ) => useHasPermission(authClient as AuthClient, params, options),
        useInvitation: (
            params: Parameters<AuthClient["organization"]["getInvitation"]>[0],
            options?: Partial<AnyUseQueryOptions>
        ) => useInvitation(authClient as AuthClient, params, options),
        useAuthMutation: useAuthMutation
    }
}
