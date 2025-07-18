"use client";

import { useEffect, useState } from "react";

import { useAnonymousSignInTracking } from "@/features/auth/hooks/use-anonymous-signin-tracking";
import { useOnSuccessTransition } from "@/features/auth/hooks/use-success-transition";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { getLocalizedError } from "@/features/auth/lib/utils";

export interface AutoGuestSignInProperties {
    onSignInError?: (error: unknown) => void;
    onSignInStart?: () => void;
    onSignInSuccess?: () => void;
    redirectTo?: string;
}

export const AutoGuestSignIn = ({ onSignInError, onSignInStart, onSignInSuccess, redirectTo }: AutoGuestSignInProperties) => {
    const { authClient, toast } = useAuth();
    const { trackAnonymousSignIn } = useAnonymousSignInTracking();
    const [hasAttempted, setHasAttempted] = useState(false);

    const { onSuccess } = useOnSuccessTransition({
        redirectTo,
    });

    useEffect(() => {
        const signInAsGuest = async () => {
            if (hasAttempted)
                return;

            try {
                setHasAttempted(true);
                onSignInStart?.();

                await authClient.signIn.anonymous({
                    throw: true,
                });

                // Track anonymous sign-in
                trackAnonymousSignIn();

                onSignInSuccess?.();
                await onSuccess();
            } catch (error) {
                console.error("Auto guest sign-in failed:", error);

                onSignInError?.(error);

                toast({
                    message: getLocalizedError({ error }),
                    variant: "error",
                });
            }
        };

        signInAsGuest();
    }, [hasAttempted, authClient, trackAnonymousSignIn, onSuccess, onSignInStart, onSignInSuccess, onSignInError, toast]);

    // This component doesn't render anything visible
    return null;
};
