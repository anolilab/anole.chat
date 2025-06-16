import { ConvexError } from "convex/values";

export const ERRORS = {
    ENVS_NOT_INITIALIZED: "Environment variables not initialized",
    RESEND_FROM_EMAIL_NOT_SENT: "Failed to send email via Resend",
} as const;

export class BaseError extends ConvexError<{
    code: number;
    message: string;
    data: any;
}> {
    constructor({ code, message, data }: { code: number; message: string; data?: any }) {
        super({ code, message, data });
    }
}

export class UnauthorizedError extends BaseError {
    constructor({ message = "Unauthorized", data }: { message?: string; data?: any }) {
        super({ code: 401, message, data });
    }
}

export class NotFoundError extends BaseError {
    constructor({ message = "Not Found", data }: { message?: string; data?: any }) {
        super({ code: 404, message, data });
    }
}

export class ServerError extends BaseError {
    constructor({ message = "Server Error", data }: { message?: string; data?: any }) {
        super({ code: 500, message, data });
    }
}
