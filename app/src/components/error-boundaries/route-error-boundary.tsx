"use client";

import { Button } from "@anole/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@anole/ui/components/card";
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import type { ErrorInfo, FC, ReactNode } from "react";
import { useCallback } from "react";
import { useLingui } from "@lingui/react/macro";

import { AuthenticationError, ErrorUtils, NetworkError } from "@/lib/errors";

import { ErrorBoundary } from "../error-boundary";

interface RouteErrorBoundaryProperties {
    children: ReactNode;
    fallbackRoute?: string;
    routeName?: string;
}

const ErrorContent: FC<{
    error: Error;
    routeName: string;
    handleGoBack: () => void;
    handleGoHome: () => void;
    handleReload: () => void;
    isAuth: boolean;
    isNetwork: boolean;
    retry: () => void;
}> = ({ error, handleGoBack, handleGoHome, handleReload, routeName, retry }) => {
    const userMessage = ErrorUtils.getUserMessage(error);
    const isAuth = error instanceof AuthenticationError;
    const isNetwork = error instanceof NetworkError;
    const { t } = useLingui();

    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-xl">{isAuth ? t`Authentication Required` : isNetwork ? t`Connection Problem` : t`Error on` + ` ${routeName}`}</CardTitle>
                    <CardDescription className="text-base">{userMessage}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted rounded-lg p-3 text-sm">
                        <p className="mb-1 font-medium text-center">{t`What happened?`}</p>
                        <p className="text-muted-foreground">
                            {isAuth
                                ? t`You need to sign in to access this page.`
                                : isNetwork
                                    ? t`There's a problem with your internet connection or our servers.`
                                    : t`An error occurred while loading the ${routeName} page.`}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        {isAuth
                            ? (
                                <Button className="w-full" onClick={() => (globalThis.location.href = "/auth/signin")}>
                                    {t`Sign In`}
                                </Button>
                            )
                            : ErrorUtils.isRetryable(error)
                                ? (
                                    <Button className="w-full" onClick={retry}>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        {t`Try Again`}
                                    </Button>
                                )
                                : (
                                    <Button className="w-full" onClick={handleReload}>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        {t`Reload Page`}
                                    </Button>
                                )}

                        <div className="grid grid-cols-2 gap-2">
                            <Button onClick={handleGoBack} variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {t`Go Back`}
                            </Button>
                            <Button onClick={handleGoHome} variant="outline">
                                <Home className="mr-2 h-4 w-4" />
                                {t`Home`}
                            </Button>
                        </div>
                    </div>

                    <div className="text-muted-foreground space-y-1 text-center text-xs">
                        {isNetwork && <p>💡 {t`Check your internet connection and try again.`}</p>}
                        {isAuth && <p>💡 {t`You'll be redirected back here after signing in.`}</p>}
                        {!isNetwork && !isAuth && <p>💡 {t`If this problem persists, please contact support.`}</p>}
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

/**
 * Route-level error boundary for page-level error handling
 * Provides navigation recovery and route-specific error handling
 */
const RouteErrorBoundary = ({ children, fallbackRoute = "/", routeName = "page" }: RouteErrorBoundaryProperties) => {
    const posthog = usePostHog();

    const handleError = useCallback(
        (error: Error, errorInfo: ErrorInfo) => {
            if (import.meta.env.DEV) {
                // eslint-disable-next-line no-console
                console.group(`🛣️ Route Error (${routeName})`);
                // eslint-disable-next-line no-console
                console.error("Error:", error);
                // eslint-disable-next-line no-console
                console.error("Error Info:", errorInfo);
                // eslint-disable-next-line no-console
                console.error("Route:", globalThis.location.pathname);
                // eslint-disable-next-line no-console
                console.error("Referrer:", document.referrer);
                // eslint-disable-next-line no-console
                console.groupEnd();
            }

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
        },
        [posthog, routeName],
    );

    const handleGoBack = useCallback(() => {
        if (globalThis.history.length > 1) {
            globalThis.history.back();
        } else {
            globalThis.location.href = fallbackRoute;
        }
    }, [fallbackRoute]);

    const handleGoHome = useCallback(() => {
        globalThis.location.href = fallbackRoute;
    }, [fallbackRoute]);

    const handleReload = useCallback(() => {
        globalThis.location.reload();
    }, []);

    const renderFallback = (error: Error, retry: () => void) => {
        return (
            <ErrorContent
                error={error}
                routeName={routeName}
                handleGoBack={handleGoBack}
                handleGoHome={handleGoHome}
                handleReload={handleReload}
                retry={retry}
            />
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

export default RouteErrorBoundary;
