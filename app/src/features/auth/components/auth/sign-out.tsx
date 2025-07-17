"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import { useOnSuccessTransition } from "@/features/auth/hooks/use-success-transition";

export const SignOut = () => {
    const signingOut = useRef(false);

    const { authClient, basePath, viewPaths } = useAuth();
    const { onSuccess } = useOnSuccessTransition({
        redirectTo: `${basePath}/${viewPaths.SIGN_IN}`,
    });

    useEffect(() => {
        if (signingOut.current) return;

        signingOut.current = true;

        authClient.signOut().finally(onSuccess);
    }, [authClient, onSuccess]);

    return <Loader2 className="animate-spin" />;
};
