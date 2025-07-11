import type { AnyUseQueryOptions, QueryKey } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";

import { useListAccounts, useUnlinkAccount } from "../hooks/account-management";
import { useCreateApiKey, useDeleteApiKey, useListApiKeys } from "../hooks/api-key-management";
import { useListDeviceSessions, useRevokeDeviceSession, useRevokeDeviceSessions, useSetActiveSession } from "../hooks/device-session-management";
import { useActiveOrganization, useHasPermission, useInvitation, useListOrganizations } from "../hooks/organization-management";
import { useDeletePasskey, useListPasskeys } from "../hooks/passkey-management";
import { useSession, useUpdateUser } from "../hooks/session-user-management";
import { useListSessions, useRevokeOtherSessions, useRevokeSession, useRevokeSessions } from "../hooks/session-management";
import { useAuthMutation } from "../hooks/shared/use-auth-mutation";
import { type BetterFetchRequest, useAuthQuery } from "../hooks/shared/use-auth-query";
import { useToken } from "../hooks/token/use-token";
import { AuthQueryContext, type AuthQueryOptions } from "./auth-query-provider";
import { prefetchSession } from "./prefetch-session";
import type { AuthClient } from "@/lib/auth/client";

export function createAuthHooks(authClient: AuthClient) {
    return {
        useSession: (options?: Partial<AnyUseQueryOptions>) => useSession(authClient, options),
        usePrefetchSession: (options?: Partial<AnyUseQueryOptions>) => {
            const queryClient = useQueryClient();
            const queryOptions = useContext(AuthQueryContext);

            return {
                prefetch: () => prefetchSession(authClient, queryClient, queryOptions, options),
            };
        },
        useUpdateUser: (options?: Partial<AuthQueryOptions>) => useUpdateUser(authClient, options),
        useToken: (options?: Partial<AnyUseQueryOptions>) => useToken(authClient, options),
        useAuthQuery: <TData>({
            queryKey,
            queryFn,
            options,
        }: {
            queryKey: QueryKey;
            queryFn: BetterFetchRequest<TData>;
            options?: Partial<AnyUseQueryOptions>;
        }) => useAuthQuery({ authClient, queryKey, queryFn, options }),
        useListAccounts: (options?: Partial<AnyUseQueryOptions>) => useListAccounts(authClient, options),
        useUnlinkAccount: () => useUnlinkAccount(authClient),
        useListSessions: (options?: Partial<AnyUseQueryOptions>) => useListSessions(authClient, options),
        useRevokeSession: (options?: Partial<AuthQueryOptions>) => useRevokeSession(authClient, options),
        useRevokeSessions: (options?: Partial<AuthQueryOptions>) => useRevokeSessions(authClient, options),
        useRevokeOtherSessions: (options?: Partial<AuthQueryOptions>) => useRevokeOtherSessions(authClient, options),
        useListDeviceSessions: (options?: Partial<AnyUseQueryOptions>) => useListDeviceSessions(authClient, options),
        useRevokeDeviceSession: (options?: Partial<AuthQueryOptions>) => useRevokeDeviceSession(authClient, options),
        useRevokeDeviceSessions: (options?: Partial<AuthQueryOptions>) => useRevokeDeviceSessions(authClient, options),
        useSetActiveSession: (options?: Partial<AuthQueryOptions>) => useSetActiveSession(authClient, options),
        useListPasskeys: (options?: Partial<AnyUseQueryOptions>) => useListPasskeys(authClient, options),
        useDeletePasskey: (options?: Partial<AuthQueryOptions>) => useDeletePasskey(authClient, options),
        useListApiKeys: (options?: Partial<AnyUseQueryOptions>) => useListApiKeys(authClient, options),
        useCreateApiKey: (options?: Partial<AuthQueryOptions>) => useCreateApiKey(authClient, options),
        useDeleteApiKey: (options?: Partial<AuthQueryOptions>) => useDeleteApiKey(authClient, options),
        useActiveOrganization: (options?: Partial<AnyUseQueryOptions>) => useActiveOrganization(authClient, options),
        useListOrganizations: (options?: Partial<AnyUseQueryOptions>) => useListOrganizations(authClient, options),
        useHasPermission: (params: Parameters<AuthClient["organization"]["hasPermission"]>[0], options?: Partial<AnyUseQueryOptions>) =>
            useHasPermission(authClient, params, options),
        useInvitation: (params: Parameters<AuthClient["organization"]["getInvitation"]>[0], options?: Partial<AnyUseQueryOptions>) =>
            useInvitation(authClient, params, options),
        useAuthMutation: useAuthMutation,
    };
}
