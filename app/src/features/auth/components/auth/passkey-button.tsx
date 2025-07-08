import { FingerprintIcon } from "lucide-react";
import { useContext } from "react";
import { t } from "@lingui/core/macro";

import { useOnSuccessTransition } from "../../hooks/use-success-transition";
import { AuthUIContext } from "../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { getLocalizedError } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import type { AuthCardClassNames } from "./auth-card";

interface PasskeyButtonProps {
    classNames?: AuthCardClassNames;
    isSubmitting?: boolean;
    redirectTo?: string;
    setIsSubmitting?: (isSubmitting: boolean) => void;
}

export function PasskeyButton({ classNames, isSubmitting, redirectTo, setIsSubmitting }: PasskeyButtonProps) {
    const { authClient, toast } = useContext(AuthUIContext);

    const { onSuccess } = useOnSuccessTransition({ redirectTo });

    const signInPassKey = async () => {
        setIsSubmitting?.(true);

        try {
            const response = await authClient.signIn.passkey({
                fetchOptions: { throw: true },
            });

            if (response?.error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({
                        error: response.error,
                    }),
                });

                setIsSubmitting?.(false);
            } else {
                onSuccess();
            }
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error }),
            });

            setIsSubmitting?.(false);
        }
    };

    return (
        <Button
            className={cn("w-full", classNames?.form?.button, classNames?.form?.secondaryButton)}
            disabled={isSubmitting}
            formNoValidate
            name="passkey"
            value="true"
            variant="secondary"
            onClick={signInPassKey}
        >
            <FingerprintIcon />
            {t`Sign in with passkey`}
        </Button>
    );
}
