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
type ApiKeyClientPlugin = ReturnType<typeof apiKeyClient>;
type MultiSessionClientPlugin = ReturnType<typeof multiSessionClient>;
type PasskeyClientPlugin = ReturnType<typeof passkeyClient>;
type OneTapClientPlugin = ReturnType<typeof oneTapClient>;
type GenericOAuthClientPlugin = ReturnType<typeof genericOAuthClient>;
type AnonymousClientPlugin = ReturnType<typeof anonymousClient>;
type UsernameClientPlugin = ReturnType<typeof usernameClient>;
type MagicLinkClientPlugin = ReturnType<typeof magicLinkClient>;
type EmailOTPClientPlugin = ReturnType<typeof emailOTPClient>;
type TwoFactorClientPlugin = ReturnType<typeof twoFactorClient>;

// Auth Client Configuration
export const authClient = createAuthClient({
    plugins: [
        apiKeyClient(),
        multiSessionClient(),
        passkeyClient(),
        oneTapClient({
            clientId: "",
        }),
        genericOAuthClient(),
        anonymousClient(),
        usernameClient(),
        magicLinkClient(),
        emailOTPClient(),
        twoFactorClient(),
        organizationClient(),
    ],
});

// Core Auth Types
export type AuthClient = typeof authClient;

export type Session = AuthClient["$Infer"]["Session"]["session"];
export type User = AuthClient["$Infer"]["Session"]["user"];

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
