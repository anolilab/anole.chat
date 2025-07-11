import { toast } from "sonner";

import { ErrorUtils as ErrorUtilities, RateLimitError } from "./errors";

export interface ToastOptions {
    action?: {
        label: string;
        onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    };
    cancel?: {
        label: string;
        onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    };
    duration?: number;
    id?: string | number;
}

/**
 * Show success toast
 */
export function showSuccess(message: string, options?: ToastOptions) {
    return toast.success(message, {
        action: options?.action,
        cancel: options?.cancel,
        duration: options?.duration || 4000,
        id: options?.id,
    });
}

/**
 * Show error toast with appropriate styling and actions
 */
export function showError(error: Error | string, options?: ToastOptions) {
    const message = typeof error === "string" ? error : ErrorUtilities.getUserMessage(error);

    const toastOptions: any = {
        action: options?.action,
        cancel: options?.cancel,
        duration: options?.duration || 6000,
        id: options?.id,
    };

    // Add retry action for retryable errors
    if (typeof error !== "string" && ErrorUtilities.isRetryable(error) && !toastOptions.action && options?.action) {
        toastOptions.action = {
            label: "Retry",
            onClick: options.action.onClick,
        };
    }

    // Special handling for rate limit errors
    if (error instanceof RateLimitError) {
        const retryAfterMinutes = error.getRetryAfterMinutes();

        toastOptions.duration = 8000; // Longer duration for rate limit messages

        if (!toastOptions.action) {
            toastOptions.action = {
                label: `Retry in ${retryAfterMinutes}m`,
                onClick: () => {
                    // Schedule a retry notification
                    setTimeout(() => {
                        showInfo("You can try again now!", { duration: 3000 });
                    }, error.retryAfter);
                },
            };
        }
    }

    return toast.error(message, toastOptions);
}

/**
 * Show warning toast
 */
export function showWarning(message: string, options?: ToastOptions) {
    return toast.warning(message, {
        action: options?.action,
        cancel: options?.cancel,
        duration: options?.duration || 5000,
        id: options?.id,
    });
}

/**
 * Show info toast
 */
export function showInfo(message: string, options?: ToastOptions) {
    return toast.info(message, {
        action: options?.action,
        cancel: options?.cancel,
        duration: options?.duration || 4000,
        id: options?.id,
    });
}

/**
 * Show loading toast
 */
export function showLoading(message: string, options?: Omit<ToastOptions, "duration">) {
    return toast.loading(message, {
        action: options?.action,
        cancel: options?.cancel,
        id: options?.id,
    });
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(id: string | number) {
    toast.dismiss(id);
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
    toast.dismiss();
}

/**
 * Promise-based toast for async operations
 */
export function showPromiseToast<T>(
    promise: Promise<T>,
    messages: {
        error: string | ((error: Error) => string);
        loading: string;
        success: string | ((data: T) => string);
    },
    options?: ToastOptions,
) {
    return toast.promise(promise, {
        action: options?.action,
        cancel: options?.cancel,
        duration: options?.duration,
        error: (error) => {
            const errorMessage = typeof messages.error === "function" ? messages.error(error) : ErrorUtilities.getUserMessage(error);

            return errorMessage;
        },
        id: options?.id,
        loading: messages.loading,
        success: (data) => (typeof messages.success === "function" ? messages.success(data) : messages.success),
    });
}

/**
 * Specialized toast for prompt improvement operations
 */
export const promptToast = {
    failed: (error: Error, retryFunction?: () => void, id?: string) => {
        if (id)
            dismissToast(id);

        return showError(error, {
            action:
                retryFunction && ErrorUtilities.isRetryable(error)
                    ? {
                        label: "Retry",
                        onClick: retryFunction,
                    }
                    : undefined,
        });
    },

    improved: (id?: string) => {
        if (id)
            dismissToast(id);

        return showSuccess("Prompt improved successfully!");
    },

    improving: (id?: string) => showLoading("Improving your prompt...", { id }),

    rateLimited: (error: RateLimitError) => {
        const minutes = error.getRetryAfterMinutes();

        return showWarning(
            `Rate limit reached. You can improve ${minutes === 1 ? "1 more prompt" : `${minutes} more prompts`} in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
            {
                action: {
                    label: "Learn More",
                    onClick: () => {
                        // Could open a modal or navigate to documentation
                        showInfo("Rate limits help ensure fair usage for all users.");
                    },
                },
                duration: 8000,
            },
        );
    },

    validationError: (field: string, message: string) => showError(`${field}: ${message}`, { duration: 5000 }),
};

/**
 * Network-related toasts
 */
export const networkToast = {
    offline: () =>
        showWarning("You're offline. Some features may not work.", {
            duration: 0, // Persistent until dismissed
            id: "offline-warning",
        }),

    online: () => {
        dismissToast("offline-warning");

        return showSuccess("Connection restored!", { duration: 3000 });
    },

    serverError: () =>
        showError("Server error. Please try again later.", {
            duration: 6000,
        }),

    timeout: (retryFunction?: () => void) =>
        showError("Request timed out", {
            action: retryFunction
                ? {
                    label: "Retry",
                    onClick: retryFunction,
                }
                : undefined,
        }),
};

/**
 * Authentication-related toasts
 */
export const authToast = {
    sessionExpired: () =>
        showWarning("Your session has expired", {
            action: {
                label: "Sign In Again",
                onClick: () => {
                    globalThis.location.href = "/auth/signin";
                },
            },
        }),

    signInRequired: () =>
        showWarning("Please sign in to continue", {
            action: {
                label: "Sign In",
                onClick: () => {
                    // Navigate to sign in page
                    globalThis.location.href = "/auth/signin";
                },
            },
        }),
};
