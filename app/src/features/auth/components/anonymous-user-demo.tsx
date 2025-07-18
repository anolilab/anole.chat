"use client";

import { t } from "@lingui/core/macro";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { useAnonymousAuth } from "../hooks/use-anonymous-auth";
import { useIsAnonymous } from "../hooks/use-is-anonymous";
import { getAnonymousUserData } from "../lib/anonymous-user-utils";
import { AnonymousUserBanner } from "./anonymous-user-banner";
import { AnonymousUserIndicator } from "./anonymous-user-indicator";
import { ConvertAnonymousAccount } from "./auth/convert-anonymous-account";

export const AnonymousUserDemo = () => {
    const { isAnonymous, user } = useIsAnonymous();
    const { isLoading, signInAnonymously } = useAnonymousAuth({
        onError: (error) => {
            console.error("Anonymous sign-in failed:", error);
        },
        onSuccess: () => {
            console.log("Anonymous sign-in successful");
        },
    });

    const anonymousData = getAnonymousUserData(user);

    return (
        <div className="space-y-6 p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Anonymous User Demo</CardTitle>
                    <CardDescription>This page demonstrates all the anonymous user features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span>Current Status:</span>
                        <AnonymousUserIndicator />
                    </div>

                    {isAnonymous && (
                        <div className="rounded-lg border p-4">
                            <h3 className="mb-2 font-semibold">Anonymous User Data:</h3>
                            <pre className="rounded bg-gray-100 p-2 text-sm">{JSON.stringify(anonymousData, null, 2)}</pre>
                        </div>
                    )}

                    {!isAnonymous && (
                        <Button disabled={isLoading} onClick={signInAnonymously}>
                            {isLoading ? "Signing in..." : "Sign in Anonymously"}
                        </Button>
                    )}
                </CardContent>
            </Card>

            <AnonymousUserBanner />

            {isAnonymous && (
                <Card>
                    <CardHeader>
                        <CardTitle>Convert Account</CardTitle>
                        <CardDescription>Convert your anonymous account to a permanent one</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ConvertAnonymousAccount
                            onSuccess={() => {
                                console.log("Account converted successfully");
                            }}
                        />
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Usage Examples</CardTitle>
                    <CardDescription>How to use the anonymous user components in your app</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="mb-2 font-medium">1. Anonymous User Banner</h4>
                        <p className="mb-2 text-sm text-gray-600">Shows a banner to anonymous users encouraging them to convert their account:</p>
                        <code className="block rounded bg-gray-100 p-2 text-xs">{`<AnonymousUserBanner />`}</code>
                    </div>

                    <Separator />

                    <div>
                        <h4 className="mb-2 font-medium">2. Anonymous User Indicator</h4>
                        <p className="mb-2 text-sm text-gray-600">Shows a badge indicating the user is anonymous:</p>
                        <code className="block rounded bg-gray-100 p-2 text-xs">{`<AnonymousUserIndicator />`}</code>
                    </div>

                    <Separator />

                    <div>
                        <h4 className="mb-2 font-medium">3. Anonymous Authentication Hook</h4>
                        <p className="mb-2 text-sm text-gray-600">Hook for anonymous authentication:</p>
                        <code className="block rounded bg-gray-100 p-2 text-xs">{`const { signInAnonymously, isLoading } = useAnonymousAuth();`}</code>
                    </div>

                    <Separator />

                    <div>
                        <h4 className="mb-2 font-medium">4. Check if User is Anonymous</h4>
                        <p className="mb-2 text-sm text-gray-600">Hook to check if current user is anonymous:</p>
                        <code className="block rounded bg-gray-100 p-2 text-xs">{`const { isAnonymous } = useIsAnonymous();`}</code>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
