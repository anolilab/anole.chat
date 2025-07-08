import {
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
import { createAuthClient } from "better-auth/react";
import type { betterAuth } from "better-auth";

// Plugin Types
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

// Core Auth Types
export type Session = AnyAuthClient["$Infer"]["Session"]["session"];
export type User = AnyAuthClient["$Infer"]["Session"]["user"];

// Any Auth Client Type (from any-auth-client.ts)
export type AnyAuthClient = Omit<ReturnType<typeof createAuthClient>, "signUp" | "getSession">;

// Better Auth Type (from better-auth.ts)
export type BetterAuth = ReturnType<typeof betterAuth>;

// Result Types for auth mutations
export type NonThrowableResult<T> = {
    data: T | null;
    error: Error | null;
};

export type ThrowableResult<T> = T;
