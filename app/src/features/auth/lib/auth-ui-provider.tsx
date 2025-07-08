"use client";

import { type ReactNode, createContext, useContext, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import { useAuthData } from "../hooks/use-auth-data";
import type { AnyAuthClient, AuthClient } from "../types/auth-core-types";
import type { AdditionalFields } from "../types/form-validation-types";
import type { AuthHooks, AuthMutators } from "../types/hook-integration-types";
import type { AvatarOptions, CaptchaOptions } from "../types/ui-configuration-types";
import type { Link } from "../types/data-structure-types";
import type { RenderToast } from "../types/hook-integration-types";
import type {
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
import { type AuthViewPaths, authViewPaths } from "./auth-view-paths";
import { getLocalizedError, getSearchParam } from "./utils";

const defaultToast: RenderToast = ({ variant = "default", message }) => {
    if (variant === "default") {
        toast(message);
    } else {
        toast[variant](message);
    }
};

export type AuthUIContextType = {
    authClient: AuthClient;
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
               * Prefix for API Keys
               */
              prefix?: string;
              /**
               * Metadata for API Keys
               */
              metadata?: Record<string, unknown>;
          }
        | boolean;
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
    credentials?: CredentialsOptions;
    /**
     * Default redirect URL after authenticating
     * @default "/"
     */
    redirectTo: string;
    /**
     * Enable or disable user change email support
     * @default true
     */
    changeEmail?: boolean;
    /**
     * User Account deletion configuration
     * @default undefined
     */
    deleteUser?: DeleteUserOptions;
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
     * Enable or disable Email OTP support
     * @default false
     */
    emailOTP?: boolean;
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
     * Enable or disable One Tap support
     * @default false
     */
    oneTap?: boolean;
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
    /**
     * Navigate to a new URL
     */
    navigate: (href: string) => void;
    /**
     * Called whenever the Session changes
     */
    onSessionChange?: () => void | Promise<void>;
    /**
     * Replace the current URL
     */
    replace: (href: string) => void;
    /**
     * Custom Link component for navigation
     */
    Link: Link;
};

export type AuthUIProviderProps = {
    children: ReactNode;
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
     * Settings configuration
     * @default { fields: ["image", "name"] }
     */
    settings?: Partial<SettingsOptions>;
    /**
     * Customize the paths for the auth views
     * @default authViewPaths
     * @remarks `AuthViewPaths`
     */
    viewPaths?: Partial<AuthViewPaths>;
    /**
     * Render custom Toasts
     * @default Sonner
     */
    toast?: RenderToast;
    /**
     * ADVANCED: Custom mutators for updating auth data
     */
    mutators?: Partial<AuthMutators>;
    /**
     * Organization plugin configuration
     */
    organization?: OrganizationOptions;
    /**
     * Enable or disable Credentials support
     * @default { forgotPassword: true }
     */
    credentials?: CredentialsOptions;
    /**
     * Enable or disable Sign Up form
     * @default { fields: ["name"] }
     */
    signUp?: SignUpOptions;
} & Partial<
    Omit<
        AuthUIContextType,
        "authClient" | "viewPaths" | "mutators" | "toast" | "hooks" | "avatar" | "settings" | "deleteUser" | "credentials" | "signUp" | "organization"
    >
>;

export const AuthUIContext = createContext<AuthUIContextType>({} as unknown as AuthUIContextType);

export const AuthUIProvider = ({
    children,
    authClient: authClientProp,
    avatar: avatarProp,
    settings: settingsProp,
    deleteUser: deleteUserProp,
    social: socialProp,
    genericOAuth: genericOAuthProp,
    basePath = "/auth",
    baseURL = "",
    captcha,
    redirectTo = "/",
    credentials: credentialsProp,
    changeEmail = true,
    freshAge = 60 * 60 * 24,
    hooks: hooksProp,
    mutators: mutatorsProp,
    nameRequired = true,
    organization: organizationProp,
    signUp: signUpProp,
    toast = defaultToast,
    viewPaths: viewPathsProp,
    ...props
}: AuthUIProviderProps) => {
    const authClient = authClientProp as AuthClient;

    const avatar = useMemo<AvatarOptions | undefined>(() => {
        if (!avatarProp) {
            return;
        }

        return {
            upload: avatarProp.upload,
            extension: avatarProp.extension || "png",
            size: avatarProp.size || 128,
        };
    }, [avatarProp]);

    const settings = useMemo<SettingsOptions | undefined>(() => {
        if (!settingsProp) {
            return;
        }

        // Remove trailing slash from basePath
        const basePath = settingsProp.basePath?.endsWith("/") ? settingsProp.basePath.slice(0, -1) : settingsProp.basePath;

        return {
            url: settingsProp.url,
            basePath,
            fields: settingsProp.fields || ["image", "name"],
        };
    }, [settingsProp]);

    const deleteUser = useMemo<DeleteUserOptions | undefined>(() => {
        if (!deleteUserProp) return;

        return deleteUserProp;
    }, [deleteUserProp]);

    const credentials = useMemo<CredentialsOptions | undefined>(() => {
        return {
            confirmPassword: credentialsProp?.confirmPassword,
            forgotPassword: credentialsProp?.forgotPassword ?? true,
            passwordValidation: credentialsProp?.passwordValidation,
            rememberMe: credentialsProp?.rememberMe,
            username: credentialsProp?.username,
        };
    }, [credentialsProp]);

    const signUp = useMemo<SignUpOptions | undefined>(() => {
        return {
            fields: signUpProp?.fields || ["name"],
        };
    }, [signUpProp]);

    const organization = useMemo<OrganizationOptionsContext | undefined>(() => {
        if (!organizationProp) {
            return {
                customRoles: [],
            };
        }

        let logo: OrganizationOptionsContext["logo"] | undefined;

        if (organizationProp.logo === true) {
            logo = {
                extension: "png",
                size: 128,
            };
        } else if (organizationProp.logo) {
            logo = {
                upload: organizationProp.logo.upload,
                extension: organizationProp.logo.extension || "png",
                size: organizationProp.logo.size || organizationProp.logo.upload ? 256 : 128,
            };
        }

        return {
            ...organizationProp,
            logo,
            customRoles: organizationProp.customRoles || [],
        };
    }, [organizationProp]);

    const defaultMutators = useMemo(() => {
        return {
            deleteApiKey: (params) =>
                authClient.apiKey.delete({
                    ...params,
                    fetchOptions: { throw: true },
                }),
            deletePasskey: (params) =>
                authClient.passkey.deletePasskey({
                    ...params,
                    fetchOptions: { throw: true },
                }),
            revokeDeviceSession: (params) =>
                authClient.multiSession.revoke({
                    ...params,
                    fetchOptions: { throw: true },
                }),
            revokeSession: (params) =>
                authClient.revokeSession({
                    ...params,
                    fetchOptions: { throw: true },
                }),
            setActiveSession: (params) =>
                authClient.multiSession.setActive({
                    ...params,
                    fetchOptions: { throw: true },
                }),
            updateUser: (params) =>
                authClient.updateUser({
                    ...params,
                    fetchOptions: { throw: true },
                }),
            unlinkAccount: (params) =>
                authClient.unlinkAccount({
                    ...params,
                    fetchOptions: { throw: true },
                }),
        } as AuthMutators;
    }, [authClient]);

    const defaultHooks = useMemo(() => {
        return {
            useSession: authClient.useSession,
            useListAccounts: () =>
                useAuthData({
                    queryFn: authClient.listAccounts,
                    cacheKey: "listAccounts",
                }),
            useListDeviceSessions: () =>
                useAuthData({
                    queryFn: authClient.multiSession.listDeviceSessions,
                    cacheKey: "listDeviceSessions",
                }),
            useListSessions: () =>
                useAuthData({
                    queryFn: authClient.listSessions,
                    cacheKey: "listSessions",
                }),
            useListPasskeys: authClient.useListPasskeys,
            useListApiKeys: () =>
                useAuthData({
                    queryFn: authClient.apiKey.list,
                    cacheKey: "listApiKeys",
                }),
            useActiveOrganization: authClient.useActiveOrganization,
            useListOrganizations: authClient.useListOrganizations,
            useHasPermission: (params) =>
                useAuthData({
                    queryFn: () => authClient.organization.hasPermission(params),
                    cacheKey: `hasPermission:${JSON.stringify(params)}`,
                }),
            useInvitation: (params) =>
                useAuthData({
                    queryFn: () => authClient.organization.getInvitation(params),
                    cacheKey: `invitation:${JSON.stringify(params)}`,
                }),
        } as AuthHooks;
    }, [authClient]);

    const viewPaths = useMemo(() => {
        return { ...authViewPaths, ...viewPathsProp } as AuthViewPaths;
    }, [viewPathsProp]);

    const hooks = useMemo(() => {
        return { ...defaultHooks, ...hooksProp } as AuthHooks;
    }, [defaultHooks, hooksProp]);

    const mutators = useMemo(() => {
        return { ...defaultMutators, ...mutatorsProp } as AuthMutators;
    }, [defaultMutators, mutatorsProp]);

    // Remove trailing slash from baseURL
    baseURL = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;

    // Remove trailing slash from basePath
    basePath = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;

    const { data: sessionData } = hooks.useSession();

    const errorShown = useRef(false);
    useEffect(() => {
        if (errorShown.current) return;

        const error = getSearchParam("error");
        if (error) {
            errorShown.current = true;
            console.log({ error });
            toast({
                variant: "error",
                message: getLocalizedError({ error }),
            });
        }
    }, [toast]);

    return (
        <AuthUIContext.Provider
            value={{
                authClient,
                avatar,
                basePath: basePath === "/" ? "" : basePath,
                baseURL,
                captcha,
                redirectTo,
                changeEmail,
                credentials,
                deleteUser,
                freshAge,
                genericOAuth: genericOAuthProp,
                hooks,
                mutators,
                nameRequired,
                organization,
                settings,
                signUp,
                social: socialProp,
                toast,
                viewPaths,
                ...props,
            }}
        >
            {sessionData &&
                (hooks.useActiveOrganization === authClient.useActiveOrganization || hooks.useListOrganizations === authClient.useListOrganizations) && (
                    <OrganizationRefetcher />
                )}
            {children}
        </AuthUIContext.Provider>
    );
};

const OrganizationRefetcher = () => {
    const { hooks } = useContext(AuthUIContext);
    const { data: sessionData } = hooks.useSession();
    const { data: activeOrganization, refetch: refetchActiveOrganization } = hooks.useActiveOrganization();
    const { data: organizations, refetch: refetchListOrganizations } = hooks.useListOrganizations();

    useEffect(() => {
        if (!sessionData?.user.id) return;
        if (activeOrganization) refetchActiveOrganization?.();
        if (organizations) refetchListOrganizations?.();
    }, [sessionData?.user.id, refetchActiveOrganization, refetchListOrganizations]);

    return null;
};
