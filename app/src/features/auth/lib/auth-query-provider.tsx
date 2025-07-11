"use client";

import type { AnyUseQueryOptions, QueryKey } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createContext } from "react";

export type AuthQueryOptions = {
    listAccountsKey: QueryKey;
    listApiKeysKey: QueryKey;
    listDeviceSessionsKey: QueryKey;
    listPasskeysKey: QueryKey;
    listSessionsKey: QueryKey;
    optimistic: boolean;
    queryOptions?: Partial<AnyUseQueryOptions>;
    refetchOnMutate: boolean;
    sessionKey: QueryKey;
    sessionQueryOptions?: Partial<AnyUseQueryOptions>;
    tokenKey: QueryKey;
    tokenQueryOptions?: Partial<AnyUseQueryOptions>;
};

export const defaultAuthQueryOptions: AuthQueryOptions = {
    listAccountsKey: ["list-accounts"],
    listApiKeysKey: ["list-api-keys"],
    listDeviceSessionsKey: ["list-device-sessions"],
    listPasskeysKey: ["list-passkeys"],
    listSessionsKey: ["list-sessions"],
    optimistic: true,
    refetchOnMutate: true,
    sessionKey: ["session"],
    tokenKey: ["token"],
};

export const AuthQueryContext = createContext<AuthQueryOptions>(defaultAuthQueryOptions);

export const AuthQueryProvider = ({
    children,
    sessionQueryOptions,
    tokenQueryOptions,
    ...properties
}: Partial<AuthQueryOptions> & {
    children: ReactNode;
}) => (
    <AuthQueryContext
        value={{
            sessionQueryOptions: {
                staleTime: 60 * 1000,
                ...sessionQueryOptions,
            },
            tokenQueryOptions: {
                staleTime: 600 * 1000,
                ...tokenQueryOptions,
            },
            ...defaultAuthQueryOptions,
            ...properties,
        }}
    >
        {children}
    </AuthQueryContext>
);
