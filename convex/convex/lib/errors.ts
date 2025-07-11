import { ConvexError } from "convex/values";

type ErrorContext = {
    [key: string]: any;
    error?: unknown;
    message: string;
};

export const ERRORS = {
    ENVS_NOT_INITIALIZED: "Environment variables not initialized",
    RESEND_FROM_EMAIL_NOT_SENT: "Failed to send email via Resend",
} as const;

export class BaseError extends ConvexError<{
    code: number;
    data: any;
    message: string;
}> {
    constructor({ code, data, message }: { code: number; data?: any; message: string }) {
        super({ code, data, message });
    }
}

export class UnauthorizedError extends BaseError {
    constructor({ data, message = "Unauthorized" }: { data?: any; message?: string }) {
        super({ code: 401, data, message });
    }
}

export class NotFoundError extends BaseError {
    constructor({ data, message = "Not Found" }: { data?: any; message?: string }) {
        super({ code: 404, data, message });
    }
}

export class ServerError extends BaseError {
    constructor({ data, message = "Server Error" }: { data?: any; message?: string }) {
        super({ code: 500, data, message });
    }
}

export type BackendErrorSchema = {
    _tag: string;
    context: ErrorContext;
};

export type NotAuthenticated = ReturnType<typeof notAuthenticated>;

export type UserNotFound = ReturnType<typeof userNotFound>;

export type SummaryGenerationFailed = ReturnType<typeof summaryGenerationFailed>;

export type BackendErrors = NotAuthenticated | UserNotFound | SummaryGenerationFailed | CreateThreadFailed | RateLimitExceeded;

export type RateLimitExceeded = ReturnType<typeof rateLimitExceeded>;

export type CreateThreadFailed = ReturnType<typeof createThreadFailed>;

export function notAuthenticated(context: ErrorContext) {
    return {
        _tag: "NotAuthenticated",
        context,
    } as const satisfies BackendErrorSchema;
}

export function userNotFound(context: ErrorContext) {
    return {
        _tag: "UserNotFound",
        context,
    } as const satisfies BackendErrorSchema;
}

export function summaryGenerationFailed(context: ErrorContext) {
    return {
        _tag: "SummaryGenerationFailed",
        context,
    } as const satisfies BackendErrorSchema;
}

export function createThreadFailed(context: ErrorContext) {
    return {
        _tag: "CreateThreadFailed",
        context,
    } as const satisfies BackendErrorSchema;
}

export function generateAiTextFailed(context: ErrorContext) {
    return {
        _tag: "GenerateAiTextFailed",
        context,
    } as const satisfies BackendErrorSchema;
}

export function sendAiMessageFailed(context: ErrorContext) {
    return {
        _tag: "SendAiMessageFailed",
        context,
    } as const satisfies BackendErrorSchema;
}

export function getAiThreadsFailed(context: ErrorContext) {
    return {
        _tag: "GetAiThreadsFailed",
        context,
    } as const satisfies BackendErrorSchema;
}

export function getAiThreadMessagesFailed(context: ErrorContext) {
    return {
        _tag: "GetAiThreadMessagesFailed",
        context,
    } as const satisfies BackendErrorSchema;
}

export function userAlreadyAuthenticated(context: ErrorContext) {
    return {
        _tag: "UserAlreadyAuthenticated",
        context,
    } as const satisfies BackendErrorSchema;
}

export function accessingAuthedMaterialAsAnonymousUser(context: ErrorContext) {
    return {
        _tag: "AccessingAuthedMaterialAsAnonymousUser",
        context,
    } as const satisfies BackendErrorSchema;
}

export function failedToCreateUser(context: ErrorContext) {
    return {
        _tag: "FailedToCreateUser",
        context,
    } as const satisfies BackendErrorSchema;
}

export function threadMigrationFailed(context: ErrorContext) {
    return {
        _tag: "ThreadMigrationFailed",
        context,
    } as const satisfies BackendErrorSchema;
}

export function continueThreadFailed(context: ErrorContext) {
    return {
        _tag: "ContinueThreadFailed",
        context,
    } as const satisfies BackendErrorSchema;
}

export function aiThreadNotFound(context: ErrorContext) {
    return {
        _tag: "AiThreadNotFound",
        context,
    } as const satisfies BackendErrorSchema;
}

export function aiToolFailure(context: ErrorContext) {
    return {
        _tag: "AiToolFailure",
        context,
    } as const satisfies BackendErrorSchema;
}

export function getAiProfilePictureFailed(context: ErrorContext) {
    return {
        _tag: "GetAiProfilePictureFailed",
        context,
    } as const satisfies BackendErrorSchema;
}

export function aiAgentPersonaNotFound(context: ErrorContext) {
    return {
        _tag: "AiAgentPersonaNotFound",
        context,
    } as const satisfies BackendErrorSchema;
}

export function rateLimitExceeded(context: ErrorContext & { name: string; retryAfter: number }) {
    return {
        _tag: "RateLimitExceeded",
        context,
    } as const satisfies BackendErrorSchema;
}

export function unknownError(context: ErrorContext) {
    return {
        _tag: "UnknownError",
        context,
    } as const satisfies BackendErrorSchema;
}
