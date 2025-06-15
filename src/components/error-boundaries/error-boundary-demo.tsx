"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary, PromptImprovementErrorBoundary, ChatErrorBoundary, AsyncErrorBoundary, useAsyncErrorHandler } from "./index";
import { RateLimitError, ValidationError, NetworkError, ServerError, AuthenticationError } from "@/lib/errors";

/**
 * Demo component for testing error boundaries
 * Only shown in development mode
 */
export function ErrorBoundaryDemo() {
    if (process.env.NODE_ENV !== "development") {
        return null;
    }

    return (
        <Card className="mx-auto mt-8 w-full max-w-4xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    🧪 Error Boundary Testing
                    <Badge variant="secondary">Development Only</Badge>
                </CardTitle>
                <CardDescription>Test different error scenarios to see how error boundaries handle them</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Basic Error Boundary Tests */}
                <div>
                    <h3 className="mb-3 font-semibold">Basic Error Boundary</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <ErrorBoundary level="component">
                            <ErrorTrigger
                                label="Throw React Error"
                                error={() => {
                                    throw new Error("Test React error");
                                }}
                            />
                        </ErrorBoundary>

                        <ErrorBoundary level="component">
                            <ErrorTrigger
                                label="Throw Rate Limit Error"
                                error={() => {
                                    throw new RateLimitError("Test rate limit", 30000);
                                }}
                            />
                        </ErrorBoundary>
                    </div>
                </div>

                {/* Prompt Improvement Error Boundary */}
                <div>
                    <h3 className="mb-3 font-semibold">Prompt Improvement Error Boundary</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <PromptImprovementErrorBoundary>
                            <ErrorTrigger
                                label="Validation Error"
                                error={() => {
                                    throw new ValidationError("Prompt too long", "prompt");
                                }}
                            />
                        </PromptImprovementErrorBoundary>

                        <PromptImprovementErrorBoundary>
                            <ErrorTrigger
                                label="Network Error"
                                error={() => {
                                    throw new NetworkError("Connection failed");
                                }}
                            />
                        </PromptImprovementErrorBoundary>
                    </div>
                </div>

                {/* Chat Error Boundary */}
                <div>
                    <h3 className="mb-3 font-semibold">Chat Error Boundary</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <ChatErrorBoundary threadId="test-thread">
                            <ErrorTrigger
                                label="Server Error"
                                error={() => {
                                    throw new ServerError("Chat service down");
                                }}
                            />
                        </ChatErrorBoundary>

                        <ChatErrorBoundary threadId="test-thread">
                            <ErrorTrigger
                                label="Auth Error"
                                error={() => {
                                    throw new AuthenticationError("Session expired");
                                }}
                            />
                        </ChatErrorBoundary>
                    </div>
                </div>

                {/* Async Error Boundary */}
                <div>
                    <h3 className="mb-3 font-semibold">Async Error Boundary</h3>
                    <AsyncErrorBoundary>
                        <AsyncErrorTrigger />
                    </AsyncErrorBoundary>
                </div>
            </CardContent>
        </Card>
    );
}

interface ErrorTriggerProps {
    label: string;
    error: () => void;
}

function ErrorTrigger({ label, error }: ErrorTriggerProps) {
    return (
        <Button variant="destructive" size="sm" onClick={error} className="w-full">
            {label}
        </Button>
    );
}

function AsyncErrorTrigger() {
    const handleAsyncError = useAsyncErrorHandler();

    const triggerAsyncError = async () => {
        try {
            // Simulate async operation that fails
            await new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new NetworkError("Async operation failed"));
                }, 1000);
            });
        } catch (error) {
            handleAsyncError(error as Error);
        }
    };

    return (
        <Button variant="destructive" size="sm" onClick={triggerAsyncError} className="w-full">
            Trigger Async Error
        </Button>
    );
}
