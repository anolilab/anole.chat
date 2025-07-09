"use client";
import { Loader2 } from "lucide-react";
import { useContext, useEffect } from "react";
import { z } from "zod/v4";
import { t } from "@lingui/core/macro";

import { useIsHydrated } from "../../../../../hooks/use-hydrated";
import { useOnSuccessTransition } from "../../../hooks/use-success-transition";
import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { getLocalizedError } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import { useAppForm } from "@/components/ui/form";
import { InputOTP } from "@/components/ui/input-otp";
import type { AuthFormClassNames } from "../auth-form";
import { OTPInputGroup } from "../otp-input-group";

export interface RecoverAccountFormProps {
    className?: string;
    classNames?: AuthFormClassNames;
    isSubmitting?: boolean;
    otpSeparators?: 0 | 1 | 2;
    redirectTo?: string;
    setIsSubmitting?: (value: boolean) => void;
}

export function RecoverAccountForm({ className, classNames, isSubmitting, otpSeparators = 0, redirectTo, setIsSubmitting }: RecoverAccountFormProps) {
    const isHydrated = useIsHydrated();

    const { authClient, toast } = useContext(AuthUIContext);

    const { onSuccess, isPending: transitionPending } = useOnSuccessTransition({
        redirectTo,
    });

    const formSchema = z.object({
        code: z
            .string()
            .min(1, {
                message: t`Backup code is required`,
            })
            .min(6, {
                message: t`Backup code is invalid`,
            }),
    });

    const form = useAppForm({
        defaultValues: {
            code: "",
        },
        validators: {
            onChange: ({ value }: { value: { code: string } }) => {
                const result = formSchema.safeParse(value);
                if (!result.success) {
                    return result.error.flatten().fieldErrors;
                }
                return undefined;
            },
        },
        onSubmit: async ({ value }: { value: { code: string } }) => {
            try {
                await authClient.twoFactor.verifyBackupCode({
                    code: value.code,
                    fetchOptions: { throw: true },
                });

                await onSuccess();
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error }),
                });

                form.reset();
            }
        },
    });

    useEffect(() => {
        form.Subscribe({
            selector: (state) => [state.isSubmitting, transitionPending],
            children: ([isFormSubmitting, isPending]) => {
                setIsSubmitting?.(Boolean(isFormSubmitting || isPending));
                return null;
            },
        });
    }, [setIsSubmitting, transitionPending]);

    return (
        <form.AppForm>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
                noValidate={isHydrated}
                className={cn("grid w-full gap-6", className, classNames?.base)}
            >
                <form.AppField
                    name="code"
                    children={(field) => (
                        <field.FormItem>
                            <field.FormLabel className={classNames?.label}>{t`Backup Code`}</field.FormLabel>

                            <field.FormControl>
                                <InputOTP
                                    value={field.state.value}
                                    maxLength={6}
                                    onChange={(value) => {
                                        field.handleChange(value);

                                        if (value.length === 6) {
                                            form.handleSubmit();
                                        }
                                    }}
                                    containerClassName={classNames?.otpInputContainer}
                                    className={classNames?.otpInput}
                                    disabled={isSubmitting}
                                >
                                    <OTPInputGroup otpSeparators={otpSeparators} />
                                </InputOTP>
                            </field.FormControl>

                            <field.FormMessage className={classNames?.error} />
                        </field.FormItem>
                    )}
                />

                <div className="grid gap-4">
                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                        children={([canSubmit, isFormSubmitting]) => (
                            <Button type="submit" disabled={!canSubmit || isSubmitting} className={cn(classNames?.button, classNames?.primaryButton)}>
                                {(isFormSubmitting || isSubmitting) && <Loader2 className="animate-spin" />}
                                {t`Recover account`}
                            </Button>
                        )}
                    />
                </div>
            </form>
        </form.AppForm>
    );
}
