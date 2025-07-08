import type { SocialProvider } from "better-auth/social-providers";
import type { Provider } from "../lib/social-providers";
import type { CaptchaProvider, PasswordValidation } from "./form-validation-types";
import type { AuthCardClassNames } from "../components/auth/auth-card";

// Avatar Configuration Types (from avatar-options.ts)
export type AvatarOptions = {
    /**
     * Upload an avatar image and return the URL string
     * @remarks `(file: File) => Promise<string>`
     */
    upload?: (file: File) => Promise<string | undefined | null>;
    /**
     * Avatar size for resizing
     * @default 128 (or 256 if upload is provided)
     */
    size: number;
    /**
     * File extension for avatar uploads
     * @default "png"
     */
    extension: string;
};

// Settings Configuration Types (from settings-options.ts)
export type SettingsOptions = {
    /**
     * Custom Settings URL
     */
    url?: string;
    /**
     * Base path for settings views
     */
    basePath?: string;
    /**
     * Array of fields to show in `<SettingsCards />`
     * @default ["image", "name"]
     */
    fields: string[];
};

// Captcha Configuration Types (from captcha-options.ts)
export type CaptchaOptions = {
    /**
     * Captcha site key
     */
    siteKey: string;
    /**
     * Captcha provider type
     */
    provider: CaptchaProvider;
    /**
     * Hide the captcha badge
     * @default false
     */
    hideBadge?: boolean;
    /**
     * Use recaptcha.net domain instead of google.com
     * @default false
     */
    recaptchaNet?: boolean;
    /**
     * Enable enterprise mode for Google reCAPTCHA
     * @default false
     */
    enterprise?: boolean;
    /**
     * Overrides the default array of paths where captcha validation is enforced
     * @default ["/sign-up/email", "/sign-in/email", "/forget-password"]
     */
    endpoints?: string[];
};

// Social Configuration Types (from social-options.ts)
export type SocialOptions = {
    /**
     * Array of Social Providers to enable
     * @remarks `SocialProvider[]`
     */
    providers: SocialProvider[];
    /**
     * Custom social sign in function
     */
    signIn?: (params: Parameters<AuthClient["signIn"]["social"]>[0]) => Promise<unknown>;
};

// Sign Up Configuration Types (from sign-up-options.ts)
export type SignUpOptions = {
    /**
     * Array of fields to show in Sign Up form
     * @default ["name"]
     */
    fields?: string[];
};

// Organization Configuration Types (from organization-options.ts)
export type OrganizationLogoOptions = {
    /**
     * Upload a logo image and return the URL string
     * @remarks `(file: File) => Promise<string>`
     */
    upload?: (file: File) => Promise<string | undefined | null>;
    /**
     * Logo size for resizing
     * @default 256 if upload is provided, 128 otherwise
     */
    size: number;
    /**
     * File extension for logo uploads
     * @default "png"
     */
    extension: string;
};

export type OrganizationOptions = {
    /**
     * Logo configuration
     * @default undefined
     */
    logo?: boolean | Partial<OrganizationLogoOptions>;
    /**
     * Custom roles to add to the built-in roles (owner, admin, member)
     * @default []
     */
    customRoles?: Array<{ role: string; label: string }>;
};

export type OrganizationOptionsContext = {
    /**
     * Logo configuration
     * @default undefined
     */
    logo?: OrganizationLogoOptions;
    /**
     * Custom roles to add to the built-in roles (owner, admin, member)
     * @default []
     */
    customRoles: Array<{ role: string; label: string }>;
};

// Gravatar Configuration Types (from gravatar-options.ts)
export type GravatarOptions = {
    /**
     * Default image type or URL
     * Options: '404', 'mp', 'identicon', 'monsterid', 'wavatar', 'retro', 'robohash', 'blank', or custom URL
     */
    d?: string;
    /**
     * Image size in pixels (1-2048)
     */
    size?: number;
    /**
     * Whether to append .jpg extension to the hash
     * @default false
     */
    jpg?: boolean;
    /**
     * Force default image even if user has Gravatar
     * @default false
     */
    forceDefault?: boolean;
};

// Generic OAuth Configuration Types (from generic-oauth-options.ts)
export type GenericOAuthOptions = {
    /**
     * Custom OAuth Providers
     * @default []
     */
    providers: Provider[];
    /**
     * Custom generic OAuth sign in function
     */
    signIn?: (params: Parameters<AuthClient["signIn"]["oauth2"]>[0]) => Promise<unknown>;
};

// Credentials Configuration Types (from credentials-options.ts)
export type CredentialsOptions = {
    /**
     * Enable or disable the Confirm Password input
     * @default false
     */
    confirmPassword?: boolean;

    /**
     * Enable or disable Forgot Password flow
     * @default true
     */
    forgotPassword?: boolean;

    /**
     * Customize the password validation
     */
    passwordValidation?: PasswordValidation;

    /**
     * Enable or disable Remember Me checkbox
     * @default false
     */
    rememberMe?: boolean;

    /**
     * Enable or disable Username support
     * @default false
     */
    username?: boolean;
};

// Delete User Configuration Types (from delete-user-options.ts)
export type DeleteUserOptions = {
    /**
     * Enable or disable email verification for account deletion
     * @default undefined
     */
    verification?: boolean;
};

export type AuthCardProps = { className?: string; classNames?: AuthCardClassNames };
