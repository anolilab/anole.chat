"use client";

import React from "react";
import type { ErrorInfo } from "react";
import { usePostHog } from "posthog-js/react";
import { ErrorBoundary } from "../error-boundary";
import { showError, networkToast } from "@/lib/toast";
import { NetworkError, ServerError, ErrorUtils } from "@/lib/errors";

interface GlobalErrorBoundaryProviderProps {
    children: React.ReactNode;
}

export function GlobalErrorBoundaryProvider({ children }: GlobalErrorBoundaryProviderProps) {
    const [isOnline, setIsOnline] = React.useState(typeof navigator !== "undefined" ? navigator.onLine : true);
    const posthog = usePostHog();

    // Monitor network status
    React.useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            networkToast.online();
        };

        const handleOffline = () => {
            setIsOnline(false);
            networkToast.offline();
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Global unhandled promise rejection handler
    React.useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error("Unhandled promise rejection:", event.reason);

            // Convert to proper error
            const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

            // Show user-friendly error
            showError(error);

            // Send error to PostHog
            posthog?.captureException(error, {
                $level: 'error',
                errorType: 'unhandled-promise-rejection',
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                isOnline,
            });

            // Prevent default browser error handling
            event.preventDefault();
        };

        window.addEventListener("unhandledrejection", handleUnhandledRejection);

        return () => {
            window.removeEventListener("unhandledrejection", handleUnhandledRejection);
        };
    }, [posthog, isOnline]);

    // Global error handler for JavaScript errors
    React.useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            console.error("Global JavaScript error:", event.error);

            const error = event.error instanceof Error ? event.error : new Error(event.message);

            // Show user-friendly error
            showError(error);

            // Send error to PostHog
            posthog?.captureException(error, {
                $level: 'error',
                errorType: 'javascript-error',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                isOnline,
            });
        };

        window.addEventListener("error", handleError);

        return () => {
            window.removeEventListener("error", handleError);
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
            $level: 'error',
            errorBoundary: 'global',
            errorType: 'react-error-boundary',
            componentStack: errorInfo.componentStack,
            context: {
                isOnline,
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                localStorage: getLocalStorageSnapshot(),
                sessionStorage: getSessionStorageSnapshot(),
            },
        });
    };

    const getLocalStorageSnapshot = React.useCallback(() => {
        try {
            const snapshot: Record<string, any> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && !key.includes("password") && !key.includes("token")) {
                    snapshot[key] = localStorage.getItem(key);
                }
            }
            return snapshot;
        } catch {
            return {};
        }
    }, []);

    const getSessionStorageSnapshot = React.useCallback(() => {
        try {
            const snapshot: Record<string, any> = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
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
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
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
                            <button
                                onClick={retry}
                                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                            >
                                Try Again
                            </button>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full rounded-lg bg-gray-600 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700"
                        >
                            Reload Application
                        </button>

                        <button
                            onClick={() => (window.location.href = "/")}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Go to Home
                        </button>
                    </div>

                    <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
                        <p>If this problem persists, please contact support.</p>
                        <p className="mt-1">
                            Error ID: <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">{`global_${Date.now().toString(36)}`}</code>
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <ErrorBoundary
            level="page"
            onError={handleGlobalError}
            fallback={renderGlobalFallback}
            maxRetries={1}
            showToast={false} // We handle our own notifications
        >
            {children}
        </ErrorBoundary>
    );
}
