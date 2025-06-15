"use client";

import React from "react";
import { ErrorBoundary, useErrorHandler } from "../error-boundary";
import { ErrorUtils } from "@/lib/errors";

interface AsyncErrorBoundaryProps {
    children: React.ReactNode;
    onError?: (error: Error) => void;
    fallback?: (error: Error, retry: () => void) => React.ReactNode;
}

/**
 * Enhanced error boundary that can catch async errors
 * Uses the useErrorHandler hook to bridge async errors to error boundaries
 */
export function AsyncErrorBoundary({ children, onError, fallback }: AsyncErrorBoundaryProps) {
    const handleError = useErrorHandler();

    // Create a context to provide error handling to child components
    const errorContext = React.useMemo(
        () => ({
            handleAsyncError: (error: Error) => {
                onError?.(error);
                handleError(error);
            },
        }),
        [handleError, onError],
    );

    return (
        <AsyncErrorContext.Provider value={errorContext}>
            <ErrorBoundary
                level="component"
                onError={(error, errorInfo) => {
                    onError?.(error);
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
const AsyncErrorContext = React.createContext<{
    handleAsyncError: (error: Error) => void;
} | null>(null);

/**
 * Hook to handle async errors within an AsyncErrorBoundary
 */
export function useAsyncErrorHandler() {
    const context = React.useContext(AsyncErrorContext);

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
export function useSafeAsync<T>(asyncFn: () => Promise<T>, deps: React.DependencyList = []) {
    const [state, setState] = React.useState<{
        data: T | null;
        error: Error | null;
        loading: boolean;
    }>({
        data: null,
        error: null,
        loading: false,
    });

    const handleAsyncError = useAsyncErrorHandler();

    const execute = React.useCallback(async () => {
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

    React.useEffect(() => {
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
    children: (props: { handleAsyncError: (error: Error) => void }) => React.ReactNode;
}

export function AsyncComponent({ children }: AsyncComponentProps) {
    const handleAsyncError = useAsyncErrorHandler();

    return <>{children({ handleAsyncError })}</>;
}
