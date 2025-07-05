import type { BetterFetchError } from "@better-fetch/fetch"
import type { Invitation } from "better-auth/plugins/organization"
import type { AnyAuthClient } from "./any-auth-client"
import type { ApiKey } from "./api-key"
import type { AuthClient } from "./auth-client"
import type { Refetch } from "./refetch"

type AnyAuthSession = AnyAuthClient["$Infer"]["Session"]

type AuthHook<T> = {
    isPending: boolean
    data?: T | null
    error?: BetterFetchError | null
    refetch?: Refetch
}

export type AuthHooks = {
    useSession: () => ReturnType<AnyAuthClient["useSession"]>
    useListAccounts: () => AuthHook<{ accountId: string; provider: string }[]>
    useListDeviceSessions: () => AuthHook<AnyAuthClient["$Infer"]["Session"][]>
    useListSessions: () => AuthHook<AnyAuthSession["session"][]>
    useListPasskeys: () => Partial<ReturnType<AuthClient["useListPasskeys"]>>
    useListApiKeys: () => AuthHook<ApiKey[]>
    useActiveOrganization: () => Partial<
        ReturnType<AuthClient["useActiveOrganization"]>
    >
    useListOrganizations: () => Partial<
        ReturnType<AuthClient["useListOrganizations"]>
    >
    useHasPermission: (
        params: Parameters<AuthClient["organization"]["hasPermission"]>[0]
    ) => AuthHook<{
        error: null
        success: boolean
    }>
    useInvitation: (
        params: Parameters<AuthClient["organization"]["getInvitation"]>[0]
    ) => AuthHook<
        Invitation & {
            organizationName: string
            organizationSlug: string
            organizationLogo?: string
        }
    >
    useIsRestoring?: () => boolean
}
