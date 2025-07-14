import { t } from "@lingui/core/macro";
import { FingerprintIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import { useOnSuccessTransition } from "../../hooks/use-success-transition";
import { getLocalizedError } from "../../lib/utils";
import type { AuthCardClassNames } from "./auth-card";

interface PasskeyButtonProperties {
    classNames?: AuthCardClassNames;
    isSubmitting?: boolean;
    redirectTo?: string;
    setIsSubmitting?: (isSubmitting: boolean) => void;
}

export const PasskeyButton = ({ classNames, isSubmitting, redirectTo, setIsSubmitting }: PasskeyButtonProperties) => {
    const { authClient, toast } = useAuth();

    const { onSuccess } = useOnSuccessTransition({ redirectTo });

    const signInPassKey = async () => {
        setIsSubmitting?.(true);

        try {
            const response = await authClient.signIn.passkey({
                fetchOptions: { throw: true },
            });

            if (response?.error) {
                toast({
                    message: getLocalizedError({
                        error: response.error,
                    }),
                    variant: "error",
                });

                setIsSubmitting?.(false);
            } else {
                onSuccess();
            }
        } catch (error) {
            toast({
                message: getLocalizedError({ error }),
                variant: "error",
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
            onClick={signInPassKey}
            value="true"
            variant="secondary"
        >
            <FingerprintIcon />
            {t`Sign in with passkey`}
        </Button>
    );
};
