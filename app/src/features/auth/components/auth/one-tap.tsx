import { useLingui } from "@lingui/react/macro";
import { useEffect, useRef } from "react";

import { useOnSuccessTransition } from "@/features/auth/hooks/use-success-transition";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";

interface OneTapProperties {
    redirectTo?: string;
}

export const OneTap = ({ redirectTo }: OneTapProperties) => {
    const { authClient, toast } = useAuth();
    const { t } = useLingui();
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
