import type { Invitation } from "better-auth/plugins/organization";
import type { BetterFetchError } from "better-auth/react";

import type { AuthClient } from "@/lib/auth/client";

import type { AnyAuthClient } from "./auth-core-types";
import type { ApiKey } from "./data-structure-types";

// Refetch Function Type (from refetch.ts)
export type Refetch = () => Promise<unknown> | unknown;

// Toast Rendering Types (from render-toast.ts)
type ToastVariant = "default" | "success" | "error" | "info" | "warning";

export type RenderToast = ({ message, variant }: { message?: string; variant?: ToastVariant }) => void;

// Auth Mutators Types (from auth-mutators.ts)
type MutateFunction<T = Record<string, unknown>> = (parameters: T) => Promise<unknown> | Promise<void>;

export interface AuthMutators {
    deleteApiKey: MutateFunction<{ keyId: string }>;
    deletePasskey: MutateFunction<{ id: string }>;
    revokeDeviceSession: MutateFunction<{ sessionToken: string }>;
    revokeSession: MutateFunction<{ token: string }>;
    setActiveSession: MutateFunction<{ sessionToken: string }>;
    unlinkAccount: MutateFunction<{ accountId?: string; providerId: string }>;
    updateUser: MutateFunction;
}

// Auth Hooks Types (from auth-hooks.ts)
type AnyAuthSession = AnyAuthClient["$Infer"]["Session"];

type AuthHook<T> = {
    data?: T | null;
    error?: BetterFetchError | null;
    isPending: boolean;
    refetch?: Refetch;
};

export type AuthHooks = {
    useActiveOrganization: () => Partial<ReturnType<AuthClient["useActiveOrganization"]>>;
    useHasPermission: (parameters: Parameters<AuthClient["organization"]["hasPermission"]>[0]) => AuthHook<{
        error: null;
        success: boolean;
    }>;
    useInvitation: (parameters: Parameters<AuthClient["organization"]["getInvitation"]>[0]) => AuthHook<
        Invitation & {
            organizationLogo?: string;
            organizationName: string;
            organizationSlug: string;
        }
    >;
    useIsRestoring?: () => boolean;
    useListAccounts: () => AuthHook<{ accountId: string; provider: string }[]>;
    useListApiKeys: () => AuthHook<ApiKey[]>;
    useListDeviceSessions: () => AuthHook<AuthClient["$Infer"]["Session"][]>;
    useListOrganizations: () => Partial<ReturnType<AuthClient["useListOrganizations"]>>;
    useListPasskeys: () => Partial<ReturnType<AuthClient["useListPasskeys"]>>;
    useListSessions: () => AuthHook<AnyAuthSession["session"][]>;
    useSession: () => ReturnType<AuthClient["useSession"]>;
};
