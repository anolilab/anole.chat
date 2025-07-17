"use client";

import { useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { createContext, use, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import type { AuthClient } from "@/lib/auth/client";

import { useAuthData } from "../hooks/use-auth-data";
import type { AnyAuthClient } from "../types/auth-core-types";
import type { AdditionalFields } from "../types/form-validation-types";
import type { AuthHooks, AuthMutators, RenderToast } from "../types/hook-integration-types";
import type {
    AvatarOptions,
    CaptchaOptions,
    CredentialsOptions,
    DeleteUserOptions,
    GenericOAuthOptions,
    GravatarOptions,
    OrganizationOptions,
    OrganizationOptionsContext,
    SettingsOptions,
    SignUpOptions,
    SocialOptions,
} from "../types/ui-configuration-types";
import type { AuthViewPaths } from "./auth-view-paths";
import { authViewPaths } from "./auth-view-paths";
import { getLocalizedError } from "./utils";

const defaultToast: RenderToast = ({ message, variant = "default" }) => {
    if (variant === "default") {
        toast(message);
    } else {
        toast[variant](message);
    }
};

const useAuthUISearch = () => {
    try {
        const search = useSearch({ strict: false }) as any;

        return search;
    } catch {
        // If useSearch fails (e.g., outside of router context), return null
        return null;
    }
};

const OrganizationRefetcher = () => {
    const { hooks } = useAuth();
    const { data: sessionData } = hooks.useSession();
    const { data: activeOrganization, refetch: refetchActiveOrganization } = hooks.useActiveOrganization();
    const { data: organizations, refetch: refetchListOrganizations } = hooks.useListOrganizations();

    useEffect(() => {
        if (!sessionData?.user.id)
            return;

        if (activeOrganization)
            refetchActiveOrganization?.();

        if (organizations)
            refetchListOrganizations?.();
    }, [sessionData?.user.id, refetchActiveOrganization, refetchListOrganizations]);

    return null;
};

export type AuthUIContextType = {
    /**
     * Additional fields for users
     */
    additionalFields?: AdditionalFields;

    /**
     * API Key plugin configuration
     */
    apiKey?:
        | {
            /**
             * Metadata for API Keys
             */
            metadata?: Record<string, unknown>;

            /**
             * Prefix for API Keys
             */
            prefix?: string;
        }
        | boolean;
    authClient: AuthClient;

    /**
     * Avatar configuration
     * @default undefined
     */
    avatar?: AvatarOptions;

    /**
     * Base path for the auth views
     * @default "/auth"
     */
    basePath: string;

    /**
     * Front end base URL for auth API callbacks
     */
    baseURL?: string;

    /**
     * Captcha configuration
     */
    captcha?: CaptchaOptions;

    /**
     * Enable or disable user change email support
     * @default true
     */
    changeEmail?: boolean;
    credentials?: CredentialsOptions;

    /**
     * User Account deletion configuration
     * @default undefined
     */
    deleteUser?: DeleteUserOptions;

    /**
     * Enable or disable Email OTP support
     * @default false
     */
    emailOTP?: boolean;

    /**
     * Show Verify Email card for unverified emails
     */
    emailVerification?: boolean;

    /**
     * Freshness age for Session data
     * @default 60 * 60 * 24
     */
    freshAge: number;

    /**
     * Generic OAuth provider configuration
     */
    genericOAuth?: GenericOAuthOptions;

    /**
     * Gravatar configuration
     */
    gravatar?: boolean | GravatarOptions;
    hooks: AuthHooks;

    /**
     * Enable or disable Magic Link support
     * @default false
     */
    magicLink?: boolean;

    /**
     * Enable or disable Multi Session support
     * @default false
     */
    multiSession?: boolean;
    mutators: AuthMutators;

    /**
     * Whether the name field should be required
     * @default true
     */
    nameRequired?: boolean;

    /**
     * Navigate to a new URL
     */
    navigate: (href: string) => void;

    /**
     * Enable or disable One Tap support
     * @default false
     */
    oneTap?: boolean;

    /**
     * Called whenever the Session changes
     */
    onSessionChange?: () => void | Promise<void>;

    /**
     * Perform some User updates optimistically
     * @default false
     */
    optimistic?: boolean;
    organization?: OrganizationOptionsContext;

    /**
     * Enable or disable Passkey support
     * @default false
     */
    passkey?: boolean;

    /**
     * Forces better-auth-tanstack to refresh the Session on the auth callback page
     * @default false
     */
    persistClient?: boolean;

    /**
     * Default redirect URL after authenticating
     * @default "/"
     */
    redirectTo: string;

    /**
     * Replace the current URL
     */
    replace: (href: string) => void;
    settings?: SettingsOptions;

    /**
     * Sign Up configuration
     */
    signUp?: SignUpOptions;

    /**
     * Social provider configuration
     */
    social?: SocialOptions;
    toast: RenderToast;

    /**
     * Enable or disable two-factor authentication support
     * @default undefined
     */
    twoFactor?: ("otp" | "totp")[];
    viewPaths: AuthViewPaths;
};

export type AuthUIProviderProps = Partial<
    Omit<
        AuthUIContextType,
        "authClient" | "viewPaths" | "mutators" | "toast" | "hooks" | "avatar" | "settings" | "deleteUser" | "credentials" | "signUp" | "organization"
    >
> & {
    /**
     * Better Auth client returned from createAuthClient
     * @default Required
     * @remarks `AuthClient`
     */
    authClient: AnyAuthClient;

    /**
     * Avatar configuration
     * @default undefined
     */
    avatar?: Partial<AvatarOptions>;
    children: ReactNode;

    /**
     * Enable or disable Credentials support
     * @default { forgotPassword: true }
     */
    credentials?: CredentialsOptions;

    /**
     * User Account deletion configuration
     * @default undefined
     */
    deleteUser?: DeleteUserOptions;

    /**
     * ADVANCED: Custom hooks for fetching auth data
     */
    hooks?: Partial<AuthHooks>;

    /**
     * ADVANCED: Custom mutators for updating auth data
     */
    mutators?: Partial<AuthMutators>;

    /**
     * Organization plugin configuration
     */
    organization?: OrganizationOptions;

    /**
     * Settings configuration
     * @default { fields: ["image", "name"] }
     */
    settings?: Partial<SettingsOptions>;

    /**
     * Enable or disable Sign Up form
     * @default { fields: ["name"] }
     */
    signUp?: SignUpOptions;

    /**
     * Render custom Toasts
     * @default Sonner
     */
    toast?: RenderToast;

    /**
     * Customize the paths for the auth views
     * @default authViewPaths
     * @remarks `AuthViewPaths`
     */
    viewPaths?: Partial<AuthViewPaths>;
};

export const AuthUIContext = createContext<AuthUIContextType>({} as unknown as AuthUIContextType);

export const useAuth = () => use(AuthUIContext);

export const AuthUIProvider = ({
    authClient: authClientProperty,
    avatar: avatarProperty,
    basePath = "/auth",
    baseURL = "",
    captcha,
    changeEmail = true,
    children,
    credentials: credentialsProperty,
    deleteUser: deleteUserProperty,
    freshAge = 60 * 60 * 24,
    genericOAuth: genericOAuthProperty,
    hooks: hooksProperty,
    mutators: mutatorsProperty,
    nameRequired = true,
    organization: organizationProperty,
    redirectTo = "/",
    settings: settingsProperty,
    signUp: signUpProperty,
    social: socialProperty,
    toast = defaultToast,
    viewPaths: viewPathsProperty,
    ...properties
}: AuthUIProviderProps) => {
    const authClient = authClientProperty as AuthClient;

    const avatar = useMemo<AvatarOptions | undefined>(() => {
        if (!avatarProperty) {
            return;
        }

        return {
            extension: avatarProperty.extension || "png",
            size: avatarProperty.size || 128,
            upload: avatarProperty.upload,
        };
    }, [avatarProperty]);

    const settings = useMemo<SettingsOptions | undefined>(() => {
        if (!settingsProperty) {
            return;
        }

        // Remove trailing slash from basePath
        const basePath = settingsProperty.basePath?.endsWith("/") ? settingsProperty.basePath.slice(0, -1) : settingsProperty.basePath;

        return {
            basePath,
            fields: settingsProperty.fields || ["image", "name"],
            url: settingsProperty.url,
        };
    }, [settingsProperty]);

    const deleteUser = useMemo<DeleteUserOptions | undefined>(() => {
        if (!deleteUserProperty)
            return;

        return deleteUserProperty;
    }, [deleteUserProperty]);

    const credentials = useMemo<CredentialsOptions | undefined>(() => {
        return {
            confirmPassword: credentialsProperty?.confirmPassword,
            forgotPassword: credentialsProperty?.forgotPassword ?? true,
            passwordValidation: credentialsProperty?.passwordValidation,
            rememberMe: credentialsProperty?.rememberMe,
            username: credentialsProperty?.username,
        };
    }, [credentialsProperty]);

    const signUp = useMemo<SignUpOptions | undefined>(() => {
        return {
            fields: signUpProperty?.fields || ["name"],
        };
    }, [signUpProperty]);

    const organization = useMemo<OrganizationOptionsContext | undefined>(() => {
        if (!organizationProperty) {
            return {
                customRoles: [],
            };
        }

        let logo: OrganizationOptionsContext["logo"] | undefined;

        if (organizationProperty.logo === true) {
            logo = {
                extension: "png",
                size: 128,
            };
        } else if (organizationProperty.logo) {
            logo = {
                extension: organizationProperty.logo.extension || "png",
                size: organizationProperty.logo.size > 0 || organizationProperty.logo.upload ? 256 : 128,
                upload: organizationProperty.logo.upload,
            };
        }

        return {
            ...organizationProperty,
            customRoles: organizationProperty.customRoles || [],
            logo,
        };
    }, [organizationProperty]);

    const defaultMutators = useMemo(
        () =>
            ({
                deleteApiKey: (parameters) =>
                    authClient.apiKey.delete({
                        ...parameters,
                        fetchOptions: { throw: true },
                    }),
                deletePasskey: (parameters) =>
                    authClient.passkey.deletePasskey({
                        ...parameters,
                        fetchOptions: { throw: true },
                    }),
                revokeDeviceSession: (parameters) =>
                    authClient.multiSession.revoke({
                        ...parameters,
                        fetchOptions: { throw: true },
                    }),
                revokeSession: (parameters) =>
                    authClient.revokeSession({
                        ...parameters,
                        fetchOptions: { throw: true },
                    }),
                setActiveSession: (parameters) =>
                    authClient.multiSession.setActive({
                        ...parameters,
                        fetchOptions: { throw: true },
                    }),
                unlinkAccount: (parameters) =>
                    authClient.unlinkAccount({
                        ...parameters,
                        fetchOptions: { throw: true },
                    }),
                updateUser: (parameters) =>
                    authClient.updateUser({
                        ...parameters,
                        fetchOptions: { throw: true },
                    }),
            }) as AuthMutators,
        [authClient],
    );

    const defaultHooks = useMemo(
        () =>
            ({
                useActiveOrganization: authClient.useActiveOrganization,
                useHasPermission: (parameters) =>
                    useAuthData({
                        cacheKey: `hasPermission:${JSON.stringify(parameters)}`,
                        queryFn: () => authClient.organization.hasPermission(parameters),
                    }),
                useInvitation: (parameters) =>
                    useAuthData({
                        cacheKey: `invitation:${JSON.stringify(parameters)}`,
                        queryFn: () => authClient.organization.getInvitation(parameters),
                    }),
                useListAccounts: () =>
                    useAuthData({
                        cacheKey: "listAccounts",
                        queryFn: authClient.listAccounts,
                    }),
                useListApiKeys: () =>
                    useAuthData({
                        cacheKey: "listApiKeys",
                        queryFn: authClient.apiKey.list,
                    }),
                useListDeviceSessions: () =>
                    useAuthData({
                        cacheKey: "listDeviceSessions",
                        queryFn: authClient.multiSession.listDeviceSessions,
                    }),
                useListOrganizations: authClient.useListOrganizations,
                useListPasskeys: authClient.useListPasskeys,
                useListSessions: () =>
                    useAuthData({
                        cacheKey: "listSessions",
                        queryFn: authClient.listSessions,
                    }),
                useSession: authClient.useSession,
            }) as AuthHooks,
        [authClient],
    );

    const viewPaths = useMemo(() => ({ ...authViewPaths, ...viewPathsProperty }) as AuthViewPaths, [viewPathsProperty]);

    const hooks = useMemo(() => ({ ...defaultHooks, ...hooksProperty }) as AuthHooks, [defaultHooks, hooksProperty]);

    const mutators = useMemo(() => ({ ...defaultMutators, ...mutatorsProperty }) as AuthMutators, [defaultMutators, mutatorsProperty]);

    // Remove trailing slash from baseURL
    baseURL = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;

    // Remove trailing slash from basePath
    basePath = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;

    const { data: sessionData } = hooks.useSession();
    const search = useAuthUISearch();

    const errorShown = useRef(false);

    useEffect(() => {
        if (errorShown.current)
            return;

        const error = search?.error;

        if (error) {
            errorShown.current = true;
            console.log({ error });
            toast({
                message: getLocalizedError({ error }),
                variant: "error",
            });
        }
    }, [search?.error, toast]);

    return (
        <AuthUIContext
            value={{
                authClient,
                avatar,
                basePath: basePath === "/" ? "" : basePath,
                baseURL,
                captcha,
                changeEmail,
                credentials,
                deleteUser,
                freshAge,
                genericOAuth: genericOAuthProperty,
                hooks,
                mutators,
                nameRequired,
                navigate: (href: string) => {
                    globalThis.location.href = href;
                },
                organization,
                redirectTo,
                replace: (href: string) => {
                    globalThis.location.replace(href);
                },
                settings,
                signUp,
                social: socialProperty,
                toast,
                viewPaths,
                ...properties,
            }}
        >
            {sessionData
                && (hooks.useActiveOrganization === authClient.useActiveOrganization || hooks.useListOrganizations === authClient.useListOrganizations) && (
                    <OrganizationRefetcher />
            )}
            {children}
        </AuthUIContext>
    );
};
