import type { betterAuth } from "better-auth";
import type {
    anonymousClient,
    apiKeyClient,
    emailOTPClient,
    genericOAuthClient,
    magicLinkClient,
    multiSessionClient,
    oneTapClient,
    organizationClient,
    passkeyClient,
    twoFactorClient,
    usernameClient,
} from "better-auth/client/plugins";
import type { createAuthClient } from "better-auth/react";

import type { AuthClient } from "@/lib/auth/client";

export type ApiKeyClientPlugin = ReturnType<typeof apiKeyClient>;
export type MultiSessionClientPlugin = ReturnType<typeof multiSessionClient>;
export type PasskeyClientPlugin = ReturnType<typeof passkeyClient>;
export type OneTapClientPlugin = ReturnType<typeof oneTapClient>;
export type GenericOAuthClientPlugin = ReturnType<typeof genericOAuthClient>;
export type AnonymousClientPlugin = ReturnType<typeof anonymousClient>;
export type UsernameClientPlugin = ReturnType<typeof usernameClient>;
export type MagicLinkClientPlugin = ReturnType<typeof magicLinkClient>;
export type EmailOTPClientPlugin = ReturnType<typeof emailOTPClient>;
export type TwoFactorClientPlugin = ReturnType<typeof twoFactorClient>;
export type OrganizationClientPlugin = ReturnType<typeof organizationClient>;

export type Session = AuthClient["$Infer"]["Session"]["session"];
export type User = AuthClient["$Infer"]["Session"]["user"];

export type AnyAuthClient = Omit<ReturnType<typeof createAuthClient>, "signUp" | "getSession">;

export type BetterAuth = ReturnType<typeof betterAuth>;

export type NonThrowableResult<T> = {
    data: T | null;
    error: Error | null;
};

export type ThrowableResult<T> = T;
