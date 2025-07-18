"use client";

import { useLastSignInMethod } from "./use-last-signin-method";

export const useSocialSignInTracking = () => {
    const { saveLastSignIn } = useLastSignInMethod();

    const trackSocialSignIn = (provider: string, email?: string) => {
        saveLastSignIn("social", email);
    };

    return {
        trackSocialSignIn,
    };
};
