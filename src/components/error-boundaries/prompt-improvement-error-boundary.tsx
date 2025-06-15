"use client";

import React from "react";
import type { ErrorInfo } from "react";
import { Sparkles, AlertTriangle, RefreshCw } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { ErrorBoundary } from "../error-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RateLimitError, ValidationError, NetworkError, ErrorUtils } from "@/lib/errors";
import { promptToast } from "@/lib/toast";

interface PromptImprovementErrorBoundaryProps {
    children: React.ReactNode;
    onRetry?: () => void;
    fallbackToInput?: boolean;
}

/**
 * Specialized error boundary for prompt improvement features
 * Provides context-aware error handling and recovery options
 */
export function PromptImprovementErrorBoundary({ children, onRetry, fallbackToInput = true }: PromptImprovementErrorBoundaryProps) {
    const posthog = usePostHog();

    const handleError = (error: Error, errorInfo: ErrorInfo) => {
        // Send error to PostHog
        posthog?.captureException(error, {
            $level: 'error',
            errorBoundary: 'prompt-improvement',
            feature: 'prompt-improvement',
            componentStack: errorInfo.componentStack,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            errorType: error.constructor.name,
        });
    };

    const renderFallback = (error: Error, retry: () => void) => {
        const isRateLimit = error instanceof RateLimitError;
        const isValidation = error instanceof ValidationError;
        const isNetwork = error instanceof NetworkError;
        const userMessage = ErrorUtils.getUserMessage(error);

        return (
            <Card className="w-full border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                            {isRateLimit ? (
                                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            )}
                        </div>
                        <div>
                            <CardTitle className="text-base text-amber-800 dark:text-amber-200">
                                {isRateLimit
                                    ? "Rate Limit Reached"
                                    : isValidation
                                      ? "Invalid Input"
                                      : isNetwork
                                        ? "Connection Issue"
                                        : "Improvement Unavailable"}
                            </CardTitle>
                            <CardDescription className="text-amber-700 dark:text-amber-300">{userMessage}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        {/* Retry button for retryable errors */}
                        {ErrorUtils.isRetryable(error) && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    retry();
                                    onRetry?.();
                                }}
                                className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
                            >
                                <RefreshCw className="mr-1 h-3 w-3" />
                                Try Again
                            </Button>
                        )}

                        {/* Rate limit specific actions */}
                        {isRateLimit && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    promptToast.rateLimited(error as RateLimitError);
                                }}
                                className="text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
                            >
                                Learn More
                            </Button>
                        )}

                        {/* Fallback to manual editing */}
                        {fallbackToInput && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    // Focus the input field for manual editing
                                    const inputElement = document.querySelector("[data-composer-input]") as HTMLTextAreaElement;
                                    if (inputElement) {
                                        inputElement.focus();
                                        promptToast.validationError("prompt", "You can edit your prompt manually");
                                    }
                                }}
                                className="text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
                            >
                                Edit Manually
                            </Button>
                        )}
                    </div>

                    {/* Additional help text based on error type */}
                    <div className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                        {isRateLimit && <p>💡 Tip: Rate limits help ensure fair usage. Try again in a few minutes.</p>}
                        {isValidation && <p>💡 Tip: Check your prompt length and content before trying again.</p>}
                        {isNetwork && <p>💡 Tip: Check your internet connection and try again.</p>}
                        {!isRateLimit && !isValidation && !isNetwork && <p>💡 Tip: You can continue editing your prompt manually while we fix this issue.</p>}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <ErrorBoundary
            level="feature"
            onError={handleError}
            fallback={renderFallback}
            maxRetries={2}
            showToast={false} // We handle toasts in the fallback
            resetKeys={onRetry ? [onRetry.toString()] : []} // Reset when retry function changes
        >
            {children}
        </ErrorBoundary>
    );
}
