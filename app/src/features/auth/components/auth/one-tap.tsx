import { useContext, useEffect, useRef } from "react";
import { t } from "@lingui/core/macro";

import { useOnSuccessTransition } from "../../hooks/use-success-transition";
import { AuthUIContext } from "../../lib/auth-ui-provider";
import { getLocalizedError } from "../../lib/utils";

interface OneTapProps {
    redirectTo?: string;
}

export function OneTap({ redirectTo }: OneTapProps) {
    const { authClient, toast } = useContext(AuthUIContext);
    const oneTapFetched = useRef(false);

    const { onSuccess } = useOnSuccessTransition({ redirectTo });

    useEffect(() => {
        if (oneTapFetched.current) return;
        oneTapFetched.current = true;

        try {
            authClient.oneTap({
                fetchOptions: {
                    throw: true,
                    onSuccess,
                },
            });
        } catch (error) {
            toast({
                variant: "error",
                message: t`An error occurred during One Tap sign in`,
            });
        }
    }, [authClient, onSuccess, toast]);

    return null;
}
