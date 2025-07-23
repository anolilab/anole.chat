/**
 * Custom error classes for the AI Chat application
 * Provides structured error handling with specific error types
 */

export interface ErrorDetails {
    code?: string;
    context?: Record<string, unknown>;
    retryAfter?: number;
    statusCode?: number;
}

/**
 * Base error class for all application errors
 */
export class AppError extends Error {
    public readonly code: string;

    public readonly statusCode: number;

    public readonly context: Record<string, unknown>;

    public readonly timestamp: Date;

    constructor(message: string, details: ErrorDetails = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = details.code || "UNKNOWN_ERROR";
        this.statusCode = details.statusCode || 500;
        this.context = details.context || {};
        this.timestamp = new Date();

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
        }
    }

    toJSON() {
        return {
            code: this.code,
            context: this.context,
            message: this.message,
            name: this.name,
            stack: this.stack,
            statusCode: this.statusCode,
            timestamp: this.timestamp.toISOString(),
        };
    }
}

/**
 * Base error for prompt improvement operations
 */
export class PromptImprovementError extends AppError {
    constructor(message: string, details: ErrorDetails = {}) {
        super(message, {
            code: "PROMPT_IMPROVEMENT_ERROR",
            statusCode: 400,
            ...details,
        });
    }
}

/**
 * Rate limiting error - when user exceeds allowed requests
 */
export class RateLimitError extends AppError {
    public readonly retryAfter: number;

    constructor(
        message: string = "Rate limit exceeded. Please try again later.",
        retryAfter: number = 60_000, // Default 1 minute
        details: ErrorDetails = {},
    ) {
        super(message, {
            code: "RATE_LIMIT_EXCEEDED",
            retryAfter,
            statusCode: 429,
            ...details,
        });
        this.retryAfter = retryAfter;
    }

    getRetryAfterSeconds(): number {
        return Math.ceil(this.retryAfter / 1000);
    }

    getRetryAfterMinutes(): number {
        return Math.ceil(this.retryAfter / 60_000);
    }
}

/**
 * Authentication/authorization errors
 */
export class AuthenticationError extends AppError {
    constructor(message: string = "Authentication required", details: ErrorDetails = {}) {
        super(message, {
            code: "AUTHENTICATION_ERROR",
            statusCode: 401,
            ...details,
        });
    }
}

/**
 * Input validation errors
 */
export class ValidationError extends AppError {
    public readonly field?: string;

    public readonly validationRules?: string[];

    constructor(message: string, field?: string, validationRules?: string[], details: ErrorDetails = {}) {
        super(message, {
            code: "VALIDATION_ERROR",
            context: {
                field,
                validationRules,
                ...details.context,
            },
            statusCode: 400,
            ...details,
        });
        this.field = field;
        this.validationRules = validationRules;
    }
}

/**
 * Network and connectivity errors
 */
export class NetworkError extends AppError {
    public readonly isRetryable: boolean;

    constructor(message: string = "Network error occurred", isRetryable: boolean = true, details: ErrorDetails = {}) {
        super(message, {
            code: "NETWORK_ERROR",
            context: {
                isRetryable,
                ...details.context,
            },
            statusCode: 503,
            ...details,
        });
        this.isRetryable = isRetryable;
    }
}

/**
 * Server-side errors
 */
export class ServerError extends AppError {
    constructor(message: string = "Internal server error", details: ErrorDetails = {}) {
        super(message, {
            code: "SERVER_ERROR",
            statusCode: 500,
            ...details,
        });
    }
}

/**
 * Timeout errors
 */
export class TimeoutError extends NetworkError {
    public readonly timeoutMs: number;

    constructor(timeoutMs: number = 30_000, message: string = `Request timed out after ${timeoutMs}ms`, details: ErrorDetails = {}) {
        super(message, true, {
            code: "TIMEOUT_ERROR",
            context: {
                timeoutMs,
                ...details.context,
            },
            statusCode: 408,
            ...details,
        });
        this.timeoutMs = timeoutMs;
    }
}

/**
 * Content/prompt related errors
 */
export class ContentError extends ValidationError {
    constructor(message: string, contentType: "prompt" | "instructions" | "response" = "prompt", details: ErrorDetails = {}) {
        super(message, contentType, undefined, {
            code: "CONTENT_ERROR",
            context: {
                contentType,
                ...details.context,
            },
            ...details,
        });
    }
}

/**
 * Error factory for creating errors from HTTP responses
 */
export const ErrorFactory = {
    fromConvexError(error: any): AppError {
        // Handle Convex-specific error formats
        if (error?.data?.kind === "RateLimitError") {
            return new RateLimitError(error.message || "Rate limit exceeded", error.data.retryAfter || 60_000, {
                context: {
                    convexError: true,
                    name: error.data.name,
                },
            });
        }

        if (error?.message?.includes("Unauthorized")) {
            return new AuthenticationError(error.message);
        }

        if (error?.message?.includes("timeout")) {
            return new TimeoutError(30_000, error.message);
        }

        return new ServerError(error?.message || "Unknown server error", {
            context: {
                convexError: true,
                originalError: error,
            },
        });
    },

    fromResponse(response: Response, message?: string): AppError {
        const { status } = response;
        const defaultMessage = message || `HTTP ${status}: ${response.statusText}`;

        switch (status) {
            case 400: {
                return new ValidationError(defaultMessage);
            }
            case 401: {
                return new AuthenticationError(defaultMessage);
            }
            case 408: {
                return new TimeoutError(30_000, defaultMessage);
            }
            case 429: {
                return new RateLimitError(defaultMessage);
            }
            case 500:
            case 502:
            case 503:
            case 504: {
                return new ServerError(defaultMessage);
            }
            default: {
                return new AppError(defaultMessage, {
                    code: "HTTP_ERROR",
                    statusCode: status,
                });
            }
        }
    },
};

/**
 * Error utilities
 */
export const ErrorUtils = {
    /**
     * Get retry delay for retryable errors
     */
    getRetryDelay(error: Error, attempt: number = 1): number {
        if (error instanceof RateLimitError) {
            return error.retryAfter;
        }

        if (error instanceof TimeoutError) {
            // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
            return Math.min(1000 * 2 ** (attempt - 1), 30_000);
        }

        if (error instanceof NetworkError || error instanceof ServerError) {
            // Exponential backoff with jitter
            const baseDelay = 1000 * 2 ** (attempt - 1);
            const jitter = Math.random() * 1000;

            return Math.min(baseDelay + jitter, 30_000);
        }

        return 0;
    },

    /**
     * Get user-friendly error message
     */
    getUserMessage(error: Error): string {
        if (error instanceof RateLimitError) {
            const minutes = error.getRetryAfterMinutes();

            return `You've reached the rate limit. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
        }

        if (error instanceof AuthenticationError) {
            return "Please sign in to continue.";
        }

        if (error instanceof ValidationError) {
            return error.message;
        }

        if (error instanceof NetworkError) {
            return "Connection error. Please check your internet connection and try again.";
        }

        if (error instanceof TimeoutError) {
            return "Request timed out. Please try again.";
        }

        if (error instanceof ServerError) {
            return "Something went wrong on our end. Please try again later.";
        }

        return error.message || "An unexpected error occurred.";
    },

    /**
     * Check if an error is retryable
     */
    isRetryable(error: Error): boolean {
        if (error instanceof NetworkError) {
            return error.isRetryable;
        }

        if (error instanceof TimeoutError) {
            return true;
        }

        if (error instanceof ServerError) {
            return true;
        }

        if (error instanceof RateLimitError) {
            return true; // Can retry after waiting
        }

        return false;
    },
};

// All error types are already exported above with individual export statements
