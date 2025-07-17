import { t } from "@lingui/core/macro";
import { useEffect, useRef } from "react";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import { useOnSuccessTransition } from "@/features/auth/hooks/use-success-transition";

interface OneTapProperties {
    redirectTo?: string;
}

export const OneTap = ({ redirectTo }: OneTapProperties) => {
    const { authClient, toast } = useAuth();
    const oneTapFetched = useRef(false);

    const { onSuccess } = useOnSuccessTransition({ redirectTo });

    useEffect(() => {
        if (oneTapFetched.current) {
            return;
        }

        oneTapFetched.current = true;

        try {
            authClient.oneTap({
                fetchOptions: {
                    onSuccess,
                    throw: true,
                },
            });
        } catch {
            toast({
                message: t`An error occurred during One Tap sign in`,
                variant: "error",
            });
        }
    }, [authClient, onSuccess, toast]);

    return null;
};
