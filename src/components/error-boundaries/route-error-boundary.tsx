"use client";

import React from "react";
import type { ErrorInfo } from "react";
import { Home, RefreshCw, ArrowLeft, AlertTriangle } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { ErrorBoundary } from "../error-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthenticationError, NetworkError, ErrorUtils } from "@/lib/errors";

interface RouteErrorBoundaryProps {
    children: React.ReactNode;
    routeName?: string;
    fallbackRoute?: string;
}

/**
 * Route-level error boundary for page-level error handling
 * Provides navigation recovery and route-specific error handling
 */
export function RouteErrorBoundary({ children, routeName = "page", fallbackRoute = "/" }: RouteErrorBoundaryProps) {
    const posthog = usePostHog();

    const handleError = (error: Error, errorInfo: ErrorInfo) => {
        // Log route-specific context
        console.group(`🛣️ Route Error (${routeName})`);
        console.error("Error:", error);
        console.error("Error Info:", errorInfo);
        console.error("Route:", window.location.pathname);
        console.error("Referrer:", document.referrer);
        console.groupEnd();

        // Send error report with route context to PostHog
        posthog?.captureException(error, {
            $level: 'error',
            errorBoundary: 'route',
            feature: 'route',
            routeName,
            route: window.location.pathname,
            referrer: document.referrer,
            componentStack: errorInfo.componentStack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            errorType: error.constructor.name,
        });
    };

    const handleGoBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = fallbackRoute;
        }
    };

    const handleGoHome = () => {
        window.location.href = fallbackRoute;
    };

    const handleReload = () => {
        window.location.reload();
    };

    const renderFallback = (error: Error, retry: () => void) => {
        const isAuth = error instanceof AuthenticationError;
        const isNetwork = error instanceof NetworkError;
        const userMessage = ErrorUtils.getUserMessage(error);

        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-800">
                <Card className="w-full max-w-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <CardTitle className="text-xl">
                            {isAuth ? "Authentication Required" : isNetwork ? "Connection Problem" : `Error on ${routeName}`}
                        </CardTitle>
                        <CardDescription className="text-base">{userMessage}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Route-specific error information */}
                        <div className="bg-muted rounded-lg p-3 text-sm">
                            <p className="mb-1 font-medium">What happened?</p>
                            <p className="text-muted-foreground">
                                {isAuth
                                    ? "You need to sign in to access this page."
                                    : isNetwork
                                      ? "There's a problem with your internet connection or our servers."
                                      : `An error occurred while loading the ${routeName} page.`}
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-2">
                            {/* Primary action based on error type */}
                            {isAuth ? (
                                <Button onClick={() => (window.location.href = "/auth/signin")} className="w-full">
                                    Sign In
                                </Button>
                            ) : ErrorUtils.isRetryable(error) ? (
                                <Button onClick={retry} className="w-full">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Try Again
                                </Button>
                            ) : (
                                <Button onClick={handleReload} className="w-full">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Reload Page
                                </Button>
                            )}

                            {/* Secondary actions */}
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" onClick={handleGoBack}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Go Back
                                </Button>
                                <Button variant="outline" onClick={handleGoHome}>
                                    <Home className="mr-2 h-4 w-4" />
                                    Home
                                </Button>
                            </div>
                        </div>

                        {/* Help text */}
                        <div className="text-muted-foreground space-y-1 text-center text-xs">
                            {isNetwork && <p>💡 Check your internet connection and try again.</p>}
                            {isAuth && <p>💡 You'll be redirected back here after signing in.</p>}
                            {!isNetwork && !isAuth && <p>💡 If this problem persists, please contact support.</p>}
                            <p className="mt-2">
                                Error ID: <code className="bg-muted rounded px-1 text-xs">{`${routeName}_${Date.now().toString(36)}`}</code>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <ErrorBoundary
            level="page"
            onError={handleError}
            fallback={renderFallback}
            maxRetries={2}
            showToast={true}
            resetKeys={[routeName]} // Reset when route changes
        >
            {children}
        </ErrorBoundary>
    );
}
