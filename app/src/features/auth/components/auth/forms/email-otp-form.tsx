"use client";

import { Loader2 } from "lucide-react";
import { useContext, useEffect, useRef } from "react";
import * as z from "zod";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { getLocalizedError } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import { useAppForm } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import type { AuthFormClassNames } from "../auth-form";

export interface EmailOTPFormProps {
    className?: string;
    classNames?: AuthFormClassNames;
    callbackURL?: string;
    redirectTo?: string;
    isSubmitting?: boolean;
    setIsSubmitting?: (isSubmitting: boolean) => void;
}

const formSchema = z.object({
    code: z.string().min(1, {
        message: t`Code is required`,
    }),
});

export function EmailOTPForm({ className, classNames, callbackURL, redirectTo, isSubmitting, setIsSubmitting }: EmailOTPFormProps) {
    const { authClient, toast } = useContext(AuthUIContext);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const form = useAppForm({
        schema: formSchema,
        defaultValues: {
            code: "",
        },
    });

    const { handleSubmit, setError, formState } = form;

    const onSubmit = handleSubmit(async (values) => {
        setIsSubmitting?.(true);

        const { data, error } = await authClient.emailOtp.verifyEmail({
            email: "",
            otp: values.code,
            callbackURL,
        });

        if (error) {
            setError("code", {
                type: "manual",
                message: getLocalizedError({ error }),
            });
            setIsSubmitting?.(false);
            return;
        }

        if (data) {
            toast?.({
                title: t`Success`,
                description: t`Email verified successfully`,
            });

            if (redirectTo) {
                window.location.href = redirectTo;
            }
        }

        setIsSubmitting?.(false);
    });

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <div className={cn("grid gap-6", className)}>
            <form onSubmit={onSubmit}>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <InputOTP {...form.register("code")} maxLength={6} className={classNames?.input}>
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                        {formState.errors.code && <p className="text-destructive text-sm">{formState.errors.code.message}</p>}
                    </div>
                    <Button type="submit" className={classNames?.submitButton} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t`Verify Code`}
                    </Button>
                </div>
            </form>
        </div>
    );
}
