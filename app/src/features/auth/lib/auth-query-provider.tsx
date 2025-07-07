"use client"

import type { AnyUseQueryOptions, QueryKey } from "@tanstack/react-query"
import { type ReactNode, createContext } from "react"

export type AuthQueryOptions = {
    queryOptions?: Partial<AnyUseQueryOptions>
    sessionQueryOptions?: Partial<AnyUseQueryOptions>
    tokenQueryOptions?: Partial<AnyUseQueryOptions>
    sessionKey: QueryKey
    tokenKey: QueryKey
    listAccountsKey: QueryKey
    listApiKeysKey: QueryKey
    listSessionsKey: QueryKey
    listDeviceSessionsKey: QueryKey
    listPasskeysKey: QueryKey
    optimistic: boolean
    refetchOnMutate: boolean
}

export const defaultAuthQueryOptions: AuthQueryOptions = {
    sessionKey: ["session"],
    tokenKey: ["token"],
    listAccountsKey: ["list-accounts"],
    listApiKeysKey: ["list-api-keys"],
    listSessionsKey: ["list-sessions"],
    listDeviceSessionsKey: ["list-device-sessions"],
    listPasskeysKey: ["list-passkeys"],
    optimistic: true,
    refetchOnMutate: true
}

export const AuthQueryContext = createContext<AuthQueryOptions>(defaultAuthQueryOptions)

export const AuthQueryProvider = ({
    children,
    sessionQueryOptions,
    tokenQueryOptions,
    ...props
}: {
    children: ReactNode
} & Partial<AuthQueryOptions>) => {
    return (
        <AuthQueryContext.Provider
            value={{
                sessionQueryOptions: {
                    staleTime: 60 * 1000,
                    ...sessionQueryOptions
                },
                tokenQueryOptions: {
                    staleTime: 600 * 1000,
                    ...tokenQueryOptions
                },
                ...defaultAuthQueryOptions,
                ...props
            }}
        >
            {children}
        </AuthQueryContext.Provider>
    )
}
