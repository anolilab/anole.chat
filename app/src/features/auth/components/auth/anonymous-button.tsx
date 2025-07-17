"use client";

import { t } from "@lingui/core/macro";
import { Loader2, UserX } from "lucide-react";
import { use, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import { useOnSuccessTransition } from "../../../hooks/use-success-transition";
import { getLocalizedError } from "../../../lib/utils";

export interface AnonymousButtonProperties {
    className?: string;
    classNames?: {
        base?: string;
        button?: string;
        icon?: string;
        text?: string;
    };
    isSubmitting?: boolean;
    redirectTo?: string;
    setIsSubmitting?: (isSubmitting: boolean) => void;
}

export const AnonymousButton = ({ 
    className, 
    classNames, 
    isSubmitting, 
    redirectTo, 
    setIsSubmitting 
}: AnonymousButtonProperties) => {
    const { authClient, toast } = useAuth();
    const [isAnonymousSubmitting, setIsAnonymousSubmitting] = useState(false);

    const { isPending: transitionPending, onSuccess } = useOnSuccessTransition({
        redirectTo,
    });

    const handleAnonymousSignIn = async () => {
        try {
            setIsAnonymousSubmitting(true);
            
            await authClient.signIn.anonymous({
                throw: true,
            });

            await onSuccess();
        } catch (error) {
            toast({
                message: getLocalizedError({ error }),
                variant: "error",
            });
        } finally {
            setIsAnonymousSubmitting(false);
        }
    };

    useEffect(() => {
        setIsSubmitting?.(Boolean(isAnonymousSubmitting || transitionPending));
    }, [isAnonymousSubmitting, transitionPending, setIsSubmitting]);

    const isLoading = isSubmitting || isAnonymousSubmitting || transitionPending;

    return (
        <Button
            className={cn(
                "w-full",
                className,
                classNames?.base
            )}
            disabled={isLoading}
            onClick={handleAnonymousSignIn}
            type="button"
            variant="outline"
        >
            {isLoading ? (
                <Loader2 className={cn("mr-2 h-4 w-4 animate-spin", classNames?.icon)} />
            ) : (
                <UserX className={cn("mr-2 h-4 w-4", classNames?.icon)} />
            )}
            <span className={classNames?.text}>
                {t`Continue as Guest`}
            </span>
        </Button>
    );
};