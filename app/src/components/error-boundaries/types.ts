import type { ReactNode, ErrorInfo } from "react";

export interface ErrorBoundaryFallbackProps {
    error: Error;
    retry: () => void;
    resetErrorBoundary: () => void;
}

export interface ErrorBoundaryConfig {
    level: "page" | "component" | "feature";
    showToast?: boolean;
    maxRetries?: number;
    resetOnPropsChange?: boolean;
    resetKeys?: Array<string | number>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface AsyncErrorBoundaryState {
    asyncError: Error | null;
}

export interface ErrorReportData {
    id: string;
    level: string;
    timestamp: string;
    error: {
        name: string;
        message: string;
        stack?: string;
    };
    errorInfo: {
        componentStack: string;
    };
    userAgent: string;
    url: string;
    userId?: string | null;
    sessionId?: string | null;
    context?: Record<string, any>;
}
