"use client";

import { usePostHog } from "posthog-js/react";
import type { DependencyList, ReactNode } from "react";
import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";

import { ErrorUtils } from "@/lib/errors";

import { ErrorBoundary, useErrorHandler } from "../error-boundary";

interface AsyncErrorBoundaryProperties {
    children: ReactNode;
    fallback?: (error: Error, retry: () => void) => ReactNode;
    onError?: (error: Error) => void;
}

/**
 * Enhanced error boundary that can catch async errors
 * Uses the useErrorHandler hook to bridge async errors to error boundaries
 */
export const AsyncErrorBoundary = ({ children, fallback, onError }: AsyncErrorBoundaryProperties) => {
    const handleError = useErrorHandler();
    const posthog = usePostHog();

    // Create a context to provide error handling to child components
    const errorContext = useMemo(() => {
        return {
            handleAsyncError: (error: Error) => {
                onError?.(error);

                // Send error to PostHog
                posthog?.captureException(error, {
                    $level: "error",
                    context: "async-operation",
                    errorBoundary: "async",
                    timestamp: new Date().toISOString(),
                    url: globalThis.location.href,
                });

                handleError(error);
            },
        };
    }, [handleError, onError, posthog]);

    return (
        <AsyncErrorContext value={errorContext}>
            <ErrorBoundary
                fallback={fallback}
                level="component"
                maxRetries={3}
                onError={(error, errorInfo) => {
                    onError?.(error);

                    // Send error to PostHog
                    posthog?.captureException(error, {
                        $level: "error",
                        componentStack: errorInfo.componentStack,
                        errorBoundary: "async",
                        timestamp: new Date().toISOString(),
                        url: globalThis.location.href,
                    });

                    console.group("🔄 Async Error Boundary");
                    console.error("Error:", error);
                    console.error("Error Info:", errorInfo);
                    console.groupEnd();
                }}
            >
                {children}
            </ErrorBoundary>
        </AsyncErrorContext>
    );
};

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
    const context = use(AsyncErrorContext);

    if (!context) {
        throw new Error("useAsyncErrorHandler must be used within an AsyncErrorBoundary");
    }

    return context.handleAsyncError;
}

/**
 * Higher-order component that wraps async functions with error handling
 */
export function withAsyncErrorHandling<T extends (...arguments_: any[]) => Promise<any>>(asyncFunction: T, onError?: (error: Error) => void): T {
    return (async (...arguments_: Parameters<T>) => {
        try {
            return await asyncFunction(...arguments_);
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
export function useSafeAsync<T>(asyncFunction: () => Promise<T>, deps: DependencyList = []) {
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
        setState((previous) => {
            return { ...previous, error: null, loading: true };
        });

        try {
            const result = await asyncFunction();

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
interface AsyncComponentProperties {
    children: (properties: { handleAsyncError: (error: Error) => void }) => ReactNode;
}

export const AsyncComponent = ({ children }: AsyncComponentProperties) => {
    const handleAsyncError = useAsyncErrorHandler();

    return <>{children({ handleAsyncError })}</>;
};
