import { toast } from "sonner";
import { AppError, RateLimitError, AuthenticationError, ValidationError, NetworkError, TimeoutError, ServerError, ErrorUtils } from "./errors";

/**
 * Toast notification utilities
 * Provides consistent error handling and user feedback
 */

export interface ToastOptions {
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
    cancel?: {
        label: string;
        onClick?: () => void;
    };
    id?: string | number;
}

/**
 * Show success toast
 */
export function showSuccess(message: string, options?: ToastOptions) {
    return toast.success(message, {
        duration: options?.duration || 4000,
        action: options?.action,
        cancel: options?.cancel,
        id: options?.id,
    });
}

/**
 * Show error toast with appropriate styling and actions
 */
export function showError(error: Error | string, options?: ToastOptions) {
    const message = typeof error === "string" ? error : ErrorUtils.getUserMessage(error);

    let toastOptions: any = {
        duration: options?.duration || 6000,
        action: options?.action,
        cancel: options?.cancel,
        id: options?.id,
    };

    // Add retry action for retryable errors
    if (typeof error !== "string" && ErrorUtils.isRetryable(error)) {
        if (!toastOptions.action && options?.action) {
            toastOptions.action = {
                label: "Retry",
                onClick: options.action.onClick,
            };
        }
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
        duration: options?.duration || 5000,
        action: options?.action,
        cancel: options?.cancel,
        id: options?.id,
    });
}

/**
 * Show info toast
 */
export function showInfo(message: string, options?: ToastOptions) {
    return toast.info(message, {
        duration: options?.duration || 4000,
        action: options?.action,
        cancel: options?.cancel,
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
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: Error) => string);
    },
    options?: ToastOptions,
) {
    return toast.promise(promise, {
        loading: messages.loading,
        success: (data) => {
            return typeof messages.success === "function" ? messages.success(data) : messages.success;
        },
        error: (error) => {
            const errorMessage = typeof messages.error === "function" ? messages.error(error) : ErrorUtils.getUserMessage(error);
            return errorMessage;
        },
        duration: options?.duration,
        action: options?.action,
        cancel: options?.cancel,
        id: options?.id,
    });
}

/**
 * Specialized toast for prompt improvement operations
 */
export const promptToast = {
    improving: (id?: string) => showLoading("Improving your prompt...", { id }),

    improved: (id?: string) => {
        if (id) dismissToast(id);
        return showSuccess("Prompt improved successfully!");
    },

    failed: (error: Error, retryFn?: () => void, id?: string) => {
        if (id) dismissToast(id);

        return showError(error, {
            action:
                retryFn && ErrorUtils.isRetryable(error)
                    ? {
                          label: "Retry",
                          onClick: retryFn,
                      }
                    : undefined,
        });
    },

    rateLimited: (error: RateLimitError) => {
        const minutes = error.getRetryAfterMinutes();
        return showWarning(
            `Rate limit reached. You can improve ${minutes === 1 ? "1 more prompt" : `${minutes} more prompts`} in ${minutes} minute${minutes !== 1 ? "s" : ""}.`,
            {
                duration: 8000,
                action: {
                    label: "Learn More",
                    onClick: () => {
                        // Could open a modal or navigate to documentation
                        showInfo("Rate limits help ensure fair usage for all users.");
                    },
                },
            },
        );
    },

    validationError: (field: string, message: string) => {
        return showError(`${field}: ${message}`, { duration: 5000 });
    },
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

    timeout: (retryFn?: () => void) =>
        showError("Request timed out", {
            action: retryFn
                ? {
                      label: "Retry",
                      onClick: retryFn,
                  }
                : undefined,
        }),

    serverError: () =>
        showError("Server error. Please try again later.", {
            duration: 6000,
        }),
};

/**
 * Authentication-related toasts
 */
export const authToast = {
    signInRequired: () =>
        showWarning("Please sign in to continue", {
            action: {
                label: "Sign In",
                onClick: () => {
                    // Navigate to sign in page
                    window.location.href = "/auth/signin";
                },
            },
        }),

    sessionExpired: () =>
        showWarning("Your session has expired", {
            action: {
                label: "Sign In Again",
                onClick: () => {
                    window.location.href = "/auth/signin";
                },
            },
        }),
};
