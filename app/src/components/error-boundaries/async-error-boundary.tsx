"use client";

import React, { createContext, useCallback, useEffect, useMemo, useState, type DependencyList, type ReactNode } from "react";
import { usePostHog } from "posthog-js/react";
import { ErrorBoundary, useErrorHandler } from "../error-boundary";
import { ErrorUtils } from "@/lib/errors";

interface AsyncErrorBoundaryProps {
    children: ReactNode;
    onError?: (error: Error) => void;
    fallback?: (error: Error, retry: () => void) => ReactNode;
}

/**
 * Enhanced error boundary that can catch async errors
 * Uses the useErrorHandler hook to bridge async errors to error boundaries
 */
export function AsyncErrorBoundary({ children, onError, fallback }: AsyncErrorBoundaryProps) {
    const handleError = useErrorHandler();
    const posthog = usePostHog();

    // Create a context to provide error handling to child components
    const errorContext = useMemo(
        () => ({
            handleAsyncError: (error: Error) => {
                onError?.(error);

                // Send error to PostHog
                posthog?.captureException(error, {
                    $level: "error",
                    errorBoundary: "async",
                    context: "async-operation",
                    url: window.location.href,
                    timestamp: new Date().toISOString(),
                });

                handleError(error);
            },
        }),
        [handleError, onError, posthog],
    );

    return (
        <AsyncErrorContext.Provider value={errorContext}>
            <ErrorBoundary
                level="component"
                onError={(error, errorInfo) => {
                    onError?.(error);

                    // Send error to PostHog
                    posthog?.captureException(error, {
                        $level: "error",
                        errorBoundary: "async",
                        componentStack: errorInfo.componentStack,
                        url: window.location.href,
                        timestamp: new Date().toISOString(),
                    });

                    console.group("🔄 Async Error Boundary");
                    console.error("Error:", error);
                    console.error("Error Info:", errorInfo);
                    console.groupEnd();
                }}
                fallback={fallback}
                maxRetries={3}
            >
                {children}
            </ErrorBoundary>
        </AsyncErrorContext.Provider>
    );
}

/**
 * Context for async error handling
 */
const AsyncErrorContext = createContext(defaultValue)<{
    handleAsyncError: (error: Error) => void;
} | null>(null);

/**
 * Hook to handle async errors within an AsyncErrorBoundary
 */
export function useAsyncErrorHandler() {
    const context = useContext(AsyncErrorContext);

    if (!context) {
        throw new Error("useAsyncErrorHandler must be used within an AsyncErrorBoundary");
    }

    return context.handleAsyncError;
}

/**
 * Higher-order component that wraps async functions with error handling
 */
export function withAsyncErrorHandling<T extends (...args: any[]) => Promise<any>>(asyncFn: T, onError?: (error: Error) => void): T {
    return (async (...args: Parameters<T>) => {
        try {
            return await asyncFn(...args);
        } catch (error) {
            const appError = error instanceof Error ? error : new Error(String(error));
            onError?.(appError);
            throw appError;
        }
    }) as T;
}

/**
 * Hook for safe async operations with automatic error boundary integration
 */
export function useSafeAsync<T>(asyncFn: () => Promise<T>, deps: DependencyList = []) {
    const [state, setState] = useState<{
        data: T | null;
        error: Error | null;
        loading: boolean;
    }>({
        data: null,
        error: null,
        loading: false,
    });

    const handleAsyncError = useAsyncErrorHandler();

    const execute = useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        try {
            const result = await asyncFn();
            setState({ data: result, error: null, loading: false });
            return result;
        } catch (error) {
            const appError = error instanceof Error ? error : new Error(String(error));
            setState({ data: null, error: appError, loading: false });

            // Only throw to error boundary if it's a critical error
            if (!ErrorUtils.isRetryable(appError)) {
                handleAsyncError(appError);
            }

            throw appError;
        }
    }, deps);

    useEffect(() => {
        execute().catch(() => {
            // Error is already handled in execute
        });
    }, [execute]);

    return {
        ...state,
        execute,
        retry: execute,
    };
}

/**
 * Component wrapper for async operations
 */
interface AsyncComponentProps {
    children: (props: { handleAsyncError: (error: Error) => void }) => ReactNode;
}

export function AsyncComponent({ children }: AsyncComponentProps) {
    const handleAsyncError = useAsyncErrorHandler();

    return <>{children({ handleAsyncError })}</>;
}
