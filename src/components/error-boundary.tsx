"use client";

import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from "lucide-react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { AppError, ErrorUtils } from "@/lib/errors";
import { showError } from "@/lib/toast";

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorId: string | null;
    retryCount: number;
    isDetailsOpen: boolean;
}

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: (error: Error, retry: () => void) => ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    level?: "page" | "component" | "feature";
    showToast?: boolean;
    maxRetries?: number;
    resetOnPropsChange?: boolean;
    resetKeys?: Array<string | number>;
}

/**
 * Enhanced Error Boundary with multiple fallback strategies and error reporting
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    private resetTimeoutId: number | null = null;

    constructor(props: ErrorBoundaryProps) {
        super(props);

        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
            retryCount: 0,
            isDetailsOpen: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        // Generate unique error ID for tracking
        const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return {
            hasError: true,
            error,
            errorId,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Update state with error info
        this.setState({ errorInfo });

        // Call custom error handler
        this.props.onError?.(error, errorInfo);

        // Show toast notification if enabled
        if (this.props.showToast !== false) {
            showError(error);
        }

        // Log error for monitoring
        this.logError(error, errorInfo);
    }

    componentDidUpdate(prevProps: ErrorBoundaryProps) {
        const { resetOnPropsChange, resetKeys } = this.props;
        const { hasError } = this.state;

        // Reset error boundary when specified props change
        if (hasError && resetOnPropsChange && resetKeys) {
            const hasResetKeyChanged = resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index]);

            if (hasResetKeyChanged) {
                this.resetErrorBoundary();
            }
        }
    }

    componentWillUnmount() {
        if (this.resetTimeoutId) {
            clearTimeout(this.resetTimeoutId);
        }
    }

    private logError = (error: Error, errorInfo: ErrorInfo) => {
        const { errorId } = this.state;
        const { level = "component" } = this.props;

        // Enhanced error logging
        const errorReport = {
            id: errorId,
            level,
            timestamp: new Date().toISOString(),
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            errorInfo: {
                componentStack: errorInfo.componentStack,
            },
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: this.getUserId(),
            sessionId: this.getSessionId(),
        };

        // Log to console in development
        if (process.env.NODE_ENV === "development") {
            console.group(`🚨 Error Boundary (${level})`);
            console.error("Error:", error);
            console.error("Error Info:", errorInfo);
            console.error("Full Report:", errorReport);
            console.groupEnd();
        }

        // Send to error reporting service in production
        if (import.meta.env.PROD) {
            this.sendErrorReport(errorReport);
        }
    };

    private getUserId = (): string | null => {
        // Get user ID from your auth system
        try {
            // This would integrate with your auth system
            return localStorage.getItem("userId") || null;
        } catch {
            return null;
        }
    };

    private getSessionId = (): string | null => {
        // Get session ID
        try {
            return sessionStorage.getItem("sessionId") || null;
        } catch {
            return null;
        }
    };

    private sendErrorReport = async (errorReport: any) => {
        try {
            // Send to PostHog error tracking
            posthog?.captureException(errorReport.error, {
                $level: 'error',
                errorBoundary: 'main',
                level: errorReport.level,
                errorId: errorReport.id,
                componentStack: errorReport.errorInfo.componentStack,
                url: errorReport.url,
                userAgent: errorReport.userAgent,
                userId: errorReport.userId,
                sessionId: errorReport.sessionId,
                timestamp: errorReport.timestamp,
                errorType: errorReport.error.name,
            });
        } catch (reportingError) {
            console.error("Failed to send error report to PostHog:", reportingError);
        }
    };

    private resetErrorBoundary = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
            retryCount: 0,
            isDetailsOpen: false,
        });
    };

    private handleRetry = () => {
        const { maxRetries = 3 } = this.props;
        const { retryCount } = this.state;

        if (retryCount < maxRetries) {
            this.setState(
                (prevState) => ({
                    ...prevState,
                    retryCount: prevState.retryCount + 1,
                }),
                () => {
                    // Reset after a short delay to allow state to update
                    this.resetTimeoutId = window.setTimeout(() => {
                        this.resetErrorBoundary();
                    }, 100);
                },
            );
        }
    };

    private handleGoHome = () => {
        window.location.href = "/";
    };

    private handleReload = () => {
        window.location.reload();
    };

    private toggleDetails = () => {
        this.setState((prevState) => ({
            isDetailsOpen: !prevState.isDetailsOpen,
        }));
    };

    private renderErrorDetails = () => {
        const { error, errorInfo, errorId } = this.state;

        if (!error) return null;

        return (
            <Collapsible open={this.state.isDetailsOpen} onOpenChange={this.toggleDetails}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="mt-4">
                        <Bug className="mr-2 h-4 w-4" />
                        Technical Details
                        {this.state.isDetailsOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4">
                    <div className="bg-muted rounded-lg p-4">
                        <div className="space-y-2 text-sm">
                            <div>
                                <strong>Error ID:</strong> <code className="bg-background rounded px-1">{errorId}</code>
                            </div>
                            <div>
                                <strong>Error Type:</strong> <Badge variant="destructive">{error.name}</Badge>
                            </div>
                            <div>
                                <strong>Message:</strong> {error.message}
                            </div>
                            {error.stack && (
                                <div>
                                    <strong>Stack Trace:</strong>
                                    <pre className="bg-background mt-1 max-h-32 overflow-auto rounded p-2 text-xs">{error.stack}</pre>
                                </div>
                            )}
                            {errorInfo?.componentStack && (
                                <div>
                                    <strong>Component Stack:</strong>
                                    <pre className="bg-background mt-1 max-h-32 overflow-auto rounded p-2 text-xs">{errorInfo.componentStack}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        );
    };

    private renderFallbackUI = () => {
        const { error, retryCount } = this.state;
        const { level = "component", maxRetries = 3 } = this.props;

        if (!error) return null;

        const canRetry = retryCount < maxRetries;
        const isAppError = error instanceof AppError;
        const userMessage = ErrorUtils.getUserMessage(error);

        // Different UI based on error level
        switch (level) {
            case "page":
                return (
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <Card className="w-full max-w-md">
                            <CardHeader className="text-center">
                                <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                                    <AlertTriangle className="text-destructive h-6 w-6" />
                                </div>
                                <CardTitle>Something went wrong</CardTitle>
                                <CardDescription>{userMessage}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    {canRetry && (
                                        <Button onClick={this.handleRetry} className="w-full">
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
                                        </Button>
                                    )}
                                    <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                                        <Home className="mr-2 h-4 w-4" />
                                        Go Home
                                    </Button>
                                    <Button variant="ghost" onClick={this.handleReload} className="w-full">
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Reload Page
                                    </Button>
                                </div>
                                {this.renderErrorDetails()}
                            </CardContent>
                        </Card>
                    </div>
                );

            case "feature":
                return (
                    <Card className="w-full">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="bg-destructive/10 flex h-8 w-8 items-center justify-center rounded-full">
                                    <AlertTriangle className="text-destructive h-4 w-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Feature Unavailable</CardTitle>
                                    <CardDescription className="text-sm">{userMessage}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                {canRetry && (
                                    <Button size="sm" onClick={this.handleRetry}>
                                        <RefreshCw className="mr-1 h-3 w-3" />
                                        Retry {retryCount > 0 && `(${retryCount})`}
                                    </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={this.handleReload}>
                                    Refresh
                                </Button>
                            </div>
                            {this.renderErrorDetails()}
                        </CardContent>
                    </Card>
                );

            case "component":
            default:
                return (
                    <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-destructive mt-0.5 h-5 w-5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                                <h3 className="text-destructive font-medium">Component Error</h3>
                                <p className="text-muted-foreground mt-1 text-sm">{userMessage}</p>
                                <div className="mt-3 flex gap-2">
                                    {canRetry && (
                                        <Button size="sm" variant="outline" onClick={this.handleRetry}>
                                            <RefreshCw className="mr-1 h-3 w-3" />
                                            Retry
                                        </Button>
                                    )}
                                </div>
                                {this.renderErrorDetails()}
                            </div>
                        </div>
                    </div>
                );
        }
    };

    render() {
        const { hasError } = this.state;
        const { children, fallback } = this.props;

        if (hasError) {
            // Use custom fallback if provided
            if (fallback && this.state.error) {
                return fallback(this.state.error, this.handleRetry);
            }

            // Use default fallback UI
            return this.renderFallbackUI();
        }

        return children;
    }
}

/**
 * Higher-order component for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(Component: React.ComponentType<P>, errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">) {
    const WrappedComponent = (props: P) => (
        <ErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

    return WrappedComponent;
}

/**
 * Hook for manually triggering error boundaries (useful for async errors)
 */
export function useErrorHandler() {
    const [error, setError] = React.useState<Error | null>(null);

    const handleError = React.useCallback((error: Error) => {
        setError(error);
    }, []);

    React.useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);

    return handleError;
}
