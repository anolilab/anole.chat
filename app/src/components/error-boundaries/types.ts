import type { ErrorInfo, ReactNode } from "react";

export interface ErrorBoundaryFallbackProperties {
    error: Error;
    resetErrorBoundary: () => void;
    retry: () => void;
}

export interface ErrorBoundaryConfig {
    level: "page" | "component" | "feature";
    maxRetries?: number;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetKeys?: (string | number)[];
    resetOnPropsChange?: boolean;
    showToast?: boolean;
}

export interface AsyncErrorBoundaryState {
    asyncError: Error | null;
}

export interface ErrorReportData {
    context?: Record<string, any>;
    error: {
        message: string;
        name: string;
        stack?: string;
    };
    errorInfo: {
        componentStack: string;
    };
    id: string;
    level: string;
    sessionId?: string | null;
    timestamp: string;
    url: string;
    userAgent: string;
    userId?: string | null;
}
