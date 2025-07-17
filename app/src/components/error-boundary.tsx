"use client";

import { Badge } from "@anole/ui/components/badge";
import { Button } from "@anole/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@anole/ui/components/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@anole/ui/components/collapsible";
import { AlertTriangle, Bug, ChevronDown, ChevronUp, Home, RefreshCw } from "lucide-react";
import posthog from "posthog-js";
import type { ErrorInfo, ReactNode } from "react";
import React, { Component } from "react";

import { AppError, ErrorUtils } from "@/lib/errors";
import { showError } from "@/lib/toast";

interface ErrorBoundaryState {
    error: Error | null;
    errorId: string | null;
    errorInfo: ErrorInfo | null;
    hasError: boolean;
    isDetailsOpen: boolean;
    retryCount: number;
}

interface ErrorBoundaryProperties {
    children: ReactNode;
    fallback?: (error: Error, retry: () => void) => ReactNode;
    level?: "page" | "component" | "feature";
    maxRetries?: number;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetKeys?: (string | number)[];
    resetOnPropsChange?: boolean;
    showToast?: boolean;
}

/**
 * Enhanced Error Boundary with multiple fallback strategies and error reporting
 */
export class ErrorBoundary extends Component<ErrorBoundaryProperties, ErrorBoundaryState> {
    private resetTimeoutId: number | null = null;

    constructor(properties: ErrorBoundaryProperties) {
        super(properties);

        this.state = {
            error: null,
            errorId: null,
            errorInfo: null,
            hasError: false,
            isDetailsOpen: false,
            retryCount: 0,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        // Generate unique error ID for tracking
        const errorId = `error_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

        return {
            error,
            errorId,
            hasError: true,
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

    componentDidUpdate(previousProperties: ErrorBoundaryProperties) {
        const { resetKeys, resetOnPropsChange } = this.props;
        const { hasError } = this.state;

        // Reset error boundary when specified props change
        if (hasError && resetOnPropsChange && resetKeys) {
            const hasResetKeyChanged = resetKeys.some((key, index) => key !== previousProperties.resetKeys?.[index]);

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
            error: {
                message: error.message,
                name: error.name,
                stack: error.stack,
            },
            errorInfo: {
                componentStack: errorInfo.componentStack,
            },
            id: errorId,
            level,
            sessionId: this.getSessionId(),
            timestamp: new Date().toISOString(),
            url: globalThis.location.href,
            userAgent: navigator.userAgent,
            userId: this.getUserId(),
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
                $level: "error",
                componentStack: errorReport.errorInfo.componentStack,
                errorBoundary: "main",
                errorId: errorReport.id,
                errorType: errorReport.error.name,
                level: errorReport.level,
                sessionId: errorReport.sessionId,
                timestamp: errorReport.timestamp,
                url: errorReport.url,
                userAgent: errorReport.userAgent,
                userId: errorReport.userId,
            });
        } catch (reportingError) {
            console.error("Failed to send error report to PostHog:", reportingError);
        }
    };

    private resetErrorBoundary = () => {
        this.setState({
            error: null,
            errorId: null,
            errorInfo: null,
            hasError: false,
            isDetailsOpen: false,
            retryCount: 0,
        });
    };

    private handleRetry = () => {
        const { maxRetries = 3 } = this.props;
        const { retryCount } = this.state;

        if (retryCount < maxRetries) {
            this.setState(
                (previousState) => {
                    return {
                        ...previousState,
                        retryCount: previousState.retryCount + 1,
                    };
                },
                () => {
                    // Reset after a short delay to allow state to update
                    this.resetTimeoutId = globalThis.setTimeout(() => {
                        this.resetErrorBoundary();
                    }, 100);
                },
            );
        }
    };

    private handleGoHome = () => {
        globalThis.location.href = "/";
    };

    private handleReload = () => {
        globalThis.location.reload();
    };

    private toggleDetails = () => {
        this.setState((previousState) => {
            return {
                isDetailsOpen: !previousState.isDetailsOpen,
            };
        });
    };

    private renderErrorDetails = () => {
        const { error, errorId, errorInfo } = this.state;

        if (!error)
            return null;

        return (
            <Collapsible onOpenChange={this.toggleDetails} open={this.state.isDetailsOpen}>
                <CollapsibleTrigger asChild>
                    <Button className="mt-4" size="sm" variant="ghost">
                        <Bug className="mr-2 h-4 w-4" />
                        Technical Details
                        {this.state.isDetailsOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4">
                    <div className="bg-muted rounded-lg p-4">
                        <div className="space-y-2 text-sm">
                            <div>
                                <strong>Error ID:</strong>
                                {" "}
                                <code className="bg-background rounded px-1">{errorId}</code>
                            </div>
                            <div>
                                <strong>Error Type:</strong>
                                {" "}
                                <Badge variant="destructive">{error.name}</Badge>
                            </div>
                            <div>
                                <strong>Message:</strong>
                                {" "}
                                {error.message}
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

        if (!error)
            return null;

        const canRetry = retryCount < maxRetries;
        const isAppError = error instanceof AppError;
        const userMessage = ErrorUtils.getUserMessage(error);

        // Different UI based on error level
        switch (level) {
            case "feature": {
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
                                    <Button onClick={this.handleRetry} size="sm">
                                        <RefreshCw className="mr-1 h-3 w-3" />
                                        Retry
                                        {" "}
                                        {retryCount > 0 && `(${retryCount})`}
                                    </Button>
                                )}
                                <Button onClick={this.handleReload} size="sm" variant="outline">
                                    Refresh
                                </Button>
                            </div>
                            {this.renderErrorDetails()}
                        </CardContent>
                    </Card>
                );
            }

            case "page": {
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
                                        <Button className="w-full" onClick={this.handleRetry}>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Try Again
                                            {" "}
                                            {retryCount > 0 && `(${retryCount}/${maxRetries})`}
                                        </Button>
                                    )}
                                    <Button className="w-full" onClick={this.handleGoHome} variant="outline">
                                        <Home className="mr-2 h-4 w-4" />
                                        Go Home
                                    </Button>
                                    <Button className="w-full" onClick={this.handleReload} variant="ghost">
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Reload Page
                                    </Button>
                                </div>
                                {this.renderErrorDetails()}
                            </CardContent>
                        </Card>
                    </div>
                );
            }

            case "component":
            default: {
                return (
                    <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-destructive mt-0.5 h-5 w-5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                                <h3 className="text-destructive font-medium">Component Error</h3>
                                <p className="text-muted-foreground mt-1 text-sm">{userMessage}</p>
                                <div className="mt-3 flex gap-2">
                                    {canRetry && (
                                        <Button onClick={this.handleRetry} size="sm" variant="outline">
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
export function withErrorBoundary<P extends object>(Component: React.ComponentType<P>, errorBoundaryProperties?: Omit<ErrorBoundaryProperties, "children">) {
    const WrappedComponent = (properties: P) => (
        <ErrorBoundary {...errorBoundaryProperties}>
            <Component {...properties} />
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
