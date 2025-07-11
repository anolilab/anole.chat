import type { RateLimitReturns } from "@convex-dev/rate-limiter";
import { RateLimiter } from "@convex-dev/rate-limiter";

import { components } from "../_generated/api";

// Time constants for readability
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

/**
 * Rate limiter configuration for the AI Chat application
 *
 * Provides different rate limits for various operations:
 * - Prompt improvement: Per-user limits to prevent abuse
 * - Chat messages: General conversation rate limiting
 * - Anonymous users: More restrictive limits
 */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
    // API key usage (if applicable)
    apiUsage: {
        capacity: 200,
        kind: "token bucket",
        period: MINUTE,
        rate: 100, // 100 API calls per minute
        shards: 5,
    },

    // Failed authentication attempts
    authFailure: {
        capacity: 5,
        kind: "fixed window",
        period: 15 * MINUTE,
        rate: 5, // 5 failed attempts per 15 minutes
    },

    // Chat message rate limits
    chatMessage: {
        capacity: 50, // Allow burst of 50 messages
        kind: "token bucket",
        period: MINUTE,
        rate: 30, // 30 messages per minute
        shards: 10,
    },

    // Anonymous chat messages
    chatMessageAnonymous: {
        capacity: 10,
        kind: "fixed window",
        period: HOUR,
        rate: 10, // 10 messages per hour for anonymous users
    },

    // Global system protection
    globalPromptImprovement: {
        capacity: 1500,
        kind: "token bucket",
        period: MINUTE,
        rate: 1000, // 1000 improvements per minute globally
        shards: 20,
    },

    // Prompt improvement rate limits
    promptImprovement: {
        capacity: 15, // Allow burst of 15 improvements
        kind: "token bucket",
        period: MINUTE,
        rate: 10, // 10 improvements per minute
        shards: 5, // Use sharding for better performance
    },

    // Anonymous user prompt improvement (more restrictive)
    promptImprovementAnonymous: {
        capacity: 3,
        kind: "fixed window",
        period: HOUR,
        rate: 3, // Only 3 improvements per hour for anonymous users
    },
});

/**
 * Rate limit configuration types for type safety
 */
export type RateLimitName
    = | "promptImprovement"
        | "promptImprovementAnonymous"
        | "chatMessage"
        | "chatMessageAnonymous"
        | "globalPromptImprovement"
        | "authFailure"
        | "apiUsage";

/**
 * Helper function to get the appropriate rate limit name based on user authentication
 */
export function getRateLimitName(operation: "promptImprovement" | "chatMessage", isAuthenticated: boolean): RateLimitName {
    if (operation === "promptImprovement") {
        return isAuthenticated ? "promptImprovement" : "promptImprovementAnonymous";
    }

    if (operation === "chatMessage") {
        return isAuthenticated ? "chatMessage" : "chatMessageAnonymous";
    }

    throw new Error(`Unknown operation: ${operation}`);
}

/**
 * Rate limit error response structure
 */
export interface RateLimitResponse {
    ok: boolean;
    remaining?: number;
    resetTime?: number;
    retryAfter?: number;
}

/**
 * Enhanced rate limit check with detailed response
 */
export async function checkRateLimit(
    context: any,
    operation: RateLimitName,
    options: {
        count?: number;
        key?: string;
        throws?: boolean;
    } = {},
): Promise<RateLimitResponse> {
    try {
        const result = await rateLimiter.limit(context, operation, {
            count: options.count || 1,
            key: options.key,
            throws: options.throws || false,
        });

        return {
            ok: result.ok,
            retryAfter: result.retryAfter,
        };
    } catch (error: any) {
        // Handle rate limit errors
        if (error?.data?.kind === "RateLimitError") {
            return {
                ok: false,
                retryAfter: error.data.retryAfter,
            };
        }

        // Re-throw non-rate-limit errors
        throw error;
    }
}

/**
 * Reset rate limit for a specific key (useful for successful operations)
 */
export async function resetRateLimit(context: any, operation: RateLimitName, key?: string): Promise<void> {
    await rateLimiter.reset(context, operation, { key });
}

/**
 * Get current rate limit status without consuming tokens
 */
export async function getRateLimitStatus(
    context: any,
    operation: RateLimitName,
    key?: string,
): Promise<{
    config: any;
    remaining: number;
    resetTime: number;
    status: RateLimitReturns;
}> {
    const status = await rateLimiter.check(context, operation, { key });
    const value = await rateLimiter.getValue(context, operation, { key });

    return {
        config: value.config,
        remaining: Math.max(0, (value.config?.capacity ?? 0) - value.value),
        resetTime: value.ts + (value.config?.period ?? 0),
        status,
    };
}
