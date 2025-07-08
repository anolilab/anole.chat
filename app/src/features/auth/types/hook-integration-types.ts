import type { BetterFetchError } from "better-auth/react";
import type { Invitation } from "better-auth/plugins/organization";
import type { AnyAuthClient } from "./auth-core-types";
import type { ApiKey } from "./data-structure-types";
import type { AuthClient } from "@/lib/auth/client";

// Refetch Function Type (from refetch.ts)
export type Refetch = () => Promise<unknown> | unknown;

// Toast Rendering Types (from render-toast.ts)
type ToastVariant = "default" | "success" | "error" | "info" | "warning";

export type RenderToast = ({ variant, message }: { variant?: ToastVariant; message?: string }) => void;

// Auth Mutators Types (from auth-mutators.ts)
type MutateFn<T = Record<string, unknown>> = (params: T) => Promise<unknown> | Promise<void>;

export interface AuthMutators {
    deleteApiKey: MutateFn<{ keyId: string }>;
    deletePasskey: MutateFn<{ id: string }>;
    revokeDeviceSession: MutateFn<{ sessionToken: string }>;
    revokeSession: MutateFn<{ token: string }>;
    setActiveSession: MutateFn<{ sessionToken: string }>;
    updateUser: MutateFn;
    unlinkAccount: MutateFn<{ providerId: string; accountId?: string }>;
}

// Auth Hooks Types (from auth-hooks.ts)
type AnyAuthSession = AnyAuthClient["$Infer"]["Session"];

type AuthHook<T> = {
    isPending: boolean;
    data?: T | null;
    error?: BetterFetchError | null;
    refetch?: Refetch;
};

export type AuthHooks = {
    useSession: () => ReturnType<AuthClient["useSession"]>;
    useListAccounts: () => AuthHook<{ accountId: string; provider: string }[]>;
    useListDeviceSessions: () => AuthHook<AuthClient["$Infer"]["Session"][]>;
    useListSessions: () => AuthHook<AnyAuthSession["session"][]>;
    useListPasskeys: () => Partial<ReturnType<AuthClient["useListPasskeys"]>>;
    useListApiKeys: () => AuthHook<ApiKey[]>;
    useActiveOrganization: () => Partial<ReturnType<AuthClient["useActiveOrganization"]>>;
    useListOrganizations: () => Partial<ReturnType<AuthClient["useListOrganizations"]>>;
    useHasPermission: (params: Parameters<AuthClient["organization"]["hasPermission"]>[0]) => AuthHook<{
        error: null;
        success: boolean;
    }>;
    useInvitation: (params: Parameters<AuthClient["organization"]["getInvitation"]>[0]) => AuthHook<
        Invitation & {
            organizationName: string;
            organizationSlug: string;
            organizationLogo?: string;
        }
    >;
    useIsRestoring?: () => boolean;
};
