"use client";

import { usePostHog } from "posthog-js/react";
import type { ErrorInfo, ReactNode  } from "react";
import { useCallback, useEffect, useState } from "react";

import { ErrorUtils, NetworkError, ServerError } from "@/lib/errors";
import { networkToast, showError } from "@/lib/toast";

import { ErrorBoundary } from "../error-boundary";

interface GlobalErrorBoundaryProviderProperties {
    children: ReactNode;
}

export const GlobalErrorBoundaryProvider = ({ children }: GlobalErrorBoundaryProviderProperties) => {
    const [isOnline, setIsOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
    const posthog = usePostHog();

    // Monitor network status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            networkToast.online();
        };

        const handleOffline = () => {
            setIsOnline(false);
            networkToast.offline();
        };

        globalThis.addEventListener("online", handleOnline);
        globalThis.addEventListener("offline", handleOffline);

        return () => {
            globalThis.removeEventListener("online", handleOnline);
            globalThis.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Global unhandled promise rejection handler
    useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error("Unhandled promise rejection:", event.reason);

            // Convert to proper error
            const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

            // Show user-friendly error
            showError(error);

            // Send error to PostHog
            posthog?.captureException(error, {
                $level: "error",
                errorType: "unhandled-promise-rejection",
                isOnline,
                timestamp: new Date().toISOString(),
                url: globalThis.location.href,
                userAgent: navigator.userAgent,
            });

            // Prevent default browser error handling
            event.preventDefault();
        };

        globalThis.addEventListener("unhandledrejection", handleUnhandledRejection);

        return () => {
            globalThis.removeEventListener("unhandledrejection", handleUnhandledRejection);
        };
    }, [posthog, isOnline]);

    // Global error handler for JavaScript errors
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            console.error("Global JavaScript error:", event.error);

            const error = event.error instanceof Error ? event.error : new Error(event.message);

            // Show user-friendly error
            showError(error);

            // Send error to PostHog
            posthog?.captureException(error, {
                $level: "error",
                colno: event.colno,
                errorType: "javascript-error",
                filename: event.filename,
                isOnline,
                lineno: event.lineno,
                timestamp: new Date().toISOString(),
                url: globalThis.location.href,
                userAgent: navigator.userAgent,
            });
        };

        globalThis.addEventListener("error", handleError);

        return () => {
            globalThis.removeEventListener("error", handleError);
        };
    }, [posthog, isOnline]);

    const handleGlobalError = (error: Error, errorInfo: ErrorInfo) => {
        console.group("🌍 Global Error Boundary");
        console.error("Error:", error);
        console.error("Error Info:", errorInfo);
        console.error("Online Status:", isOnline);
        console.groupEnd();

        // Send comprehensive error report to PostHog
        posthog?.captureException(error, {
            $level: "error",
            componentStack: errorInfo.componentStack,
            context: {
                isOnline,
                localStorage: getLocalStorageSnapshot(),
                sessionStorage: getSessionStorageSnapshot(),
                timestamp: new Date().toISOString(),
                url: globalThis.location.href,
                userAgent: navigator.userAgent,
            },
            errorBoundary: "global",
            errorType: "react-error-boundary",
        });
    };

    const getLocalStorageSnapshot = useCallback(() => {
        try {
            const snapshot: Record<string, any> = {};

            for (let index = 0; index < localStorage.length; index++) {
                const key = localStorage.key(index);

                if (key && !key.includes("password") && !key.includes("token")) {
                    snapshot[key] = localStorage.getItem(key);
                }
            }

            return snapshot;
        } catch {
            return {};
        }
    }, []);

    const getSessionStorageSnapshot = useCallback(() => {
        try {
            const snapshot: Record<string, any> = {};

            for (let index = 0; index < sessionStorage.length; index++) {
                const key = sessionStorage.key(index);

                if (key && !key.includes("password") && !key.includes("token")) {
                    snapshot[key] = sessionStorage.getItem(key);
                }
            }

            return snapshot;
        } catch {
            return {};
        }
    }, []);

    const renderGlobalFallback = (error: Error, retry: () => void) => {
        const isNetwork = error instanceof NetworkError;
        const isServer = error instanceof ServerError;
        const userMessage = ErrorUtils.getUserMessage(error);

        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4 dark:from-red-950 dark:to-red-900">
                <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-xl dark:bg-gray-900">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                        <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                            />
                        </svg>
                    </div>

                    <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">Application Error</h1>

                    <p className="mb-6 text-gray-600 dark:text-gray-400">{userMessage}</p>

                    {!isOnline && (
                        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">⚠️ You're currently offline. Some features may not work properly.</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {ErrorUtils.isRetryable(error) && (
                            <button className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700" onClick={retry}>
                                Try Again
                            </button>
                        )}

                        <button
                            className="w-full rounded-lg bg-gray-600 px-4 py-2 font-medium text-white hover:bg-gray-700"
                            onClick={() => globalThis.location.reload()}
                        >
                            Reload Application
                        </button>

                        <button
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                            onClick={() => (globalThis.location.href = "/")}
                        >
                            Go to Home
                        </button>
                    </div>

                    <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
                        <p>If this problem persists, please contact support.</p>
                        <p className="mt-1">
                            Error ID:
                            {" "}
                            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">{`global_${Date.now().toString(36)}`}</code>
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <ErrorBoundary
            fallback={renderGlobalFallback}
            level="page"
            maxRetries={1}
            onError={handleGlobalError}
            showToast={false} // We handle our own notifications
        >
            {children}
        </ErrorBoundary>
    );
};
