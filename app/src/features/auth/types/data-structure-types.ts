import type { ComponentType, ReactNode } from "react";

// API Key Data Structure (from api-key.ts)
export type ApiKey = {
    createdAt: Date;
    expiresAt?: Date;
    id: string;
    name: string;
    start: string;
    updatedAt: Date;
};

// User Profile Data Structure (from profile.ts)
export type Profile = {
    avatar?: string | null;
    avatarUrl?: string | null;
    displayName?: string | null;
    displayUsername?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    firstName?: string | null;
    fullName?: string | null;
    id?: string | number;
    image?: string | null;
    isAnonymous?: boolean | null;
    name?: string | null;
    username?: string | null;
};

// Account Listing Data Structure (from list-account.ts)
export type ListAccount = {
    accountId: string;
    createdAt: Date;
    id: string;
    provider: string;
    scopes: string[];
    updatedAt: Date;
};

// Fetch Error Data Structure (from fetch-error.ts)
export type FetchError = {
    code?: string | undefined;
    message?: string | undefined;
    status?: number;
    statusText?: string;
};

// Link Component Type (from link.ts)
export type Link = ComponentType<{
    children: ReactNode;
    className?: string;
    href: string;
}>;
