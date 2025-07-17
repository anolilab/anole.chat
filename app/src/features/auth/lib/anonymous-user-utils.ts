import type { User } from "better-auth";

export interface AnonymousUserData {
    userId: string;
    isAnonymous: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Check if a user is anonymous
 */
export function isAnonymousUser(user: User | null | undefined): boolean {
    return user?.isAnonymous ?? false;
}

/**
 * Get anonymous user data from a user object
 */
export function getAnonymousUserData(user: User | null | undefined): AnonymousUserData | null {
    if (!user || !isAnonymousUser(user)) {
        return null;
    }

    return {
        userId: user.id,
        isAnonymous: user.isAnonymous,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
    };
}

/**
 * Check if anonymous users are enabled in the current environment
 */
export function isAnonymousAuthEnabled(): boolean {
    // You can add environment-specific logic here
    // For example, disable anonymous auth in production
    return true;
}

/**
 * Get the maximum age for anonymous sessions (in seconds)
 */
export function getAnonymousSessionMaxAge(): number {
    // Default to 30 days for anonymous sessions
    return 30 * 24 * 60 * 60;
}

/**
 * Get the maximum number of anonymous sessions per IP
 */
export function getMaxAnonymousSessionsPerIP(): number {
    // Default to 5 anonymous sessions per IP
    return 5;
}