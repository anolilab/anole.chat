import type { AnyUseQueryOptions } from "@tanstack/react-query";
import type { AnyAuthClient } from "../types/auth-core-types";
import type { AuthClient } from "@/lib/auth/client";
import { useAuthQuery } from "./shared/use-auth-query";

// Active Organization Hook
export function useActiveOrganization<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AnyUseQueryOptions>) {
    const queryKey = ["active-organization"];

    return useAuthQuery({
        authClient,
        queryKey,
        queryFn: authClient.organization.getFullOrganization,
        options,
    });
}

// Organization Listing Hook
export function useListOrganizations<TAuthClient extends AuthClient>(authClient: TAuthClient, options?: Partial<AnyUseQueryOptions>) {
    const queryKey = ["organizations"];

    return useAuthQuery({
        authClient,
        queryKey,
        queryFn: authClient.organization.list,
        options,
    });
}

// Invitation Details Hook
export function useInvitation<TAuthClient extends AnyAuthClient>(
    authClient: TAuthClient,
    params: Parameters<AuthClient["organization"]["getInvitation"]>[0],
    options?: Partial<AnyUseQueryOptions>,
) {
    const queryKey = ["invitation", JSON.stringify(params)];

    return useAuthQuery({
        authClient,
        queryKey,
        queryFn: (fnParams) => (authClient as AuthClient).organization.getInvitation({ ...params, ...fnParams }),
        options,
    });
}

// Permission Check Hook
export function useHasPermission<TAuthClient extends AnyAuthClient>(
    authClient: TAuthClient,
    params: Parameters<AuthClient["organization"]["hasPermission"]>[0],
    options?: Partial<AnyUseQueryOptions>,
) {
    const queryKey = ["has-permission", JSON.stringify(params)];

    return useAuthQuery({
        authClient,
        queryKey,
        queryFn: (fnParams) => (authClient as AuthClient).organization.hasPermission({ ...params, ...fnParams }),
        options,
    });
}
