"use client";

import { useLastSignInMethod } from "./use-last-signin-method";

export const useAnonymousSignInTracking = () => {
    const { saveLastSignIn } = useLastSignInMethod();

    const trackAnonymousSignIn = () => {
        saveLastSignIn("anonymous");
    };

    return {
        trackAnonymousSignIn,
    };
};
