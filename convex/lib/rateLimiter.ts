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
    // Prompt improvement rate limits
    promptImprovement: {
        kind: "token bucket",
        rate: 10, // 10 improvements per minute
        period: MINUTE,
        capacity: 15, // Allow burst of 15 improvements
        shards: 5, // Use sharding for better performance
    },

    // Anonymous user prompt improvement (more restrictive)
    promptImprovementAnonymous: {
        kind: "fixed window",
        rate: 3, // Only 3 improvements per hour for anonymous users
        period: HOUR,
        capacity: 3,
    },

    // Chat message rate limits
    chatMessage: {
        kind: "token bucket",
        rate: 30, // 30 messages per minute
        period: MINUTE,
        capacity: 50, // Allow burst of 50 messages
        shards: 10,
    },

    // Anonymous chat messages
    chatMessageAnonymous: {
        kind: "fixed window",
        rate: 10, // 10 messages per hour for anonymous users
        period: HOUR,
        capacity: 10,
    },

    // Global system protection
    globalPromptImprovement: {
        kind: "token bucket",
        rate: 1000, // 1000 improvements per minute globally
        period: MINUTE,
        capacity: 1500,
        shards: 20,
    },

    // Failed authentication attempts
    authFailure: {
        kind: "fixed window",
        rate: 5, // 5 failed attempts per 15 minutes
        period: 15 * MINUTE,
        capacity: 5,
    },

    // API key usage (if applicable)
    apiUsage: {
        kind: "token bucket",
        rate: 100, // 100 API calls per minute
        period: MINUTE,
        capacity: 200,
        shards: 5,
    },
});

/**
 * Rate limit configuration types for type safety
 */
export type RateLimitName =
    | "promptImprovement"
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
    retryAfter?: number;
    remaining?: number;
    resetTime?: number;
}

/**
 * Enhanced rate limit check with detailed response
 */
export async function checkRateLimit(
    ctx: any,
    operation: RateLimitName,
    options: {
        key?: string;
        count?: number;
        throws?: boolean;
    } = {},
): Promise<RateLimitResponse> {
    try {
        const result = await rateLimiter.limit(ctx, operation, {
            key: options.key,
            count: options.count || 1,
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
export async function resetRateLimit(ctx: any, operation: RateLimitName, key?: string): Promise<void> {
    await rateLimiter.reset(ctx, operation, { key });
}

/**
 * Get current rate limit status without consuming tokens
 */
export async function getRateLimitStatus(
    ctx: any,
    operation: RateLimitName,
    key?: string,
): Promise<{
    remaining: number;
    resetTime: number;
    config: any;
}> {
    const status = await rateLimiter.check(ctx, operation, { key });
    const value = await rateLimiter.getValue(ctx, operation, { key });

    return {
        remaining: Math.max(0, value.config.capacity - value.value),
        resetTime: value.ts + value.config.period,
        config: value.config,
    };
}
