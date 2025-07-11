"use client";

import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import type { ErrorInfo } from "react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthenticationError, ErrorUtils, NetworkError } from "@/lib/errors";

import { ErrorBoundary } from "../error-boundary";

interface RouteErrorBoundaryProperties {
    children: React.ReactNode;
    fallbackRoute?: string;
    routeName?: string;
}

/**
 * Route-level error boundary for page-level error handling
 * Provides navigation recovery and route-specific error handling
 */
export const RouteErrorBoundary = ({ children, fallbackRoute = "/", routeName = "page" }: RouteErrorBoundaryProperties) => {
    const posthog = usePostHog();

    const handleError = (error: Error, errorInfo: ErrorInfo) => {
        // Log route-specific context
        console.group(`🛣️ Route Error (${routeName})`);
        console.error("Error:", error);
        console.error("Error Info:", errorInfo);
        console.error("Route:", globalThis.location.pathname);
        console.error("Referrer:", document.referrer);
        console.groupEnd();

        // Send error report with route context to PostHog
        posthog?.captureException(error, {
            $level: "error",
            componentStack: errorInfo.componentStack,
            errorBoundary: "route",
            errorType: error.constructor.name,
            feature: "route",
            referrer: document.referrer,
            route: globalThis.location.pathname,
            routeName,
            timestamp: new Date().toISOString(),
            url: globalThis.location.href,
            userAgent: navigator.userAgent,
        });
    };

    const handleGoBack = () => {
        if (globalThis.history.length > 1) {
            globalThis.history.back();
        } else {
            globalThis.location.href = fallbackRoute;
        }
    };

    const handleGoHome = () => {
        globalThis.location.href = fallbackRoute;
    };

    const handleReload = () => {
        globalThis.location.reload();
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
                            {isAuth
                                ? (
                                    <Button className="w-full" onClick={() => (globalThis.location.href = "/auth/signin")}>
                                        Sign In
                                    </Button>
                                )
                                : ErrorUtils.isRetryable(error)
                                    ? (
                                        <Button className="w-full" onClick={retry}>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Try Again
                                        </Button>
                                    )
                                    : (
                                        <Button className="w-full" onClick={handleReload}>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Reload Page
                                        </Button>
                                    )}

                            {/* Secondary actions */}
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={handleGoBack} variant="outline">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Go Back
                                </Button>
                                <Button onClick={handleGoHome} variant="outline">
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
                                Error ID:
                                {" "}
                                <code className="bg-muted rounded px-1 text-xs">{`${routeName}_${Date.now().toString(36)}`}</code>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <ErrorBoundary
            fallback={renderFallback}
            level="page"
            maxRetries={2}
            onError={handleError}
            resetKeys={[routeName]} // Reset when route changes
            showToast
        >
            {children}
        </ErrorBoundary>
    );
};
