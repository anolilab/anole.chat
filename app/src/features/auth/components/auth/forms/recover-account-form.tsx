"use client";

import { Button } from "@anole/ui/components/button";
import { useAppForm } from "@anole/ui/components/form";
import { InputOTP } from "@anole/ui/components/input-otp";
import { useIsHydrated } from "@anole/ui/hooks/use-hydrated.d";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { Loader2 } from "lucide-react";
import { use, useEffect } from "react";
import { z } from "zod/v4";

import { useOnSuccessTransition } from "@/features/auth/hooks/use-success-transition";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { getLocalizedError } from "@/features/auth/lib/utils";

import type { AuthFormClassNames } from "../auth-form";
import { OTPInputGroup } from "../otp-input-group";

export interface RecoverAccountFormProperties {
    className?: string;
    classNames?: AuthFormClassNames;
    isSubmitting?: boolean;
    otpSeparators?: 0 | 1 | 2;
    redirectTo?: string;
    setIsSubmitting?: (value: boolean) => void;
}

export const RecoverAccountForm = ({ className, classNames, isSubmitting, otpSeparators = 0, redirectTo, setIsSubmitting }: RecoverAccountFormProperties) => {
    const { t } = useLingui();
    const isHydrated = useIsHydrated();

    const { authClient, toast } = useAuth();

    const { isPending: transitionPending, onSuccess } = useOnSuccessTransition({
        redirectTo,
    });

    const formSchema = z
        .object({
            code: z
                .string()
                .min(1, {
                    message: t`Backup code is required`,
                })
                .min(6, {
                    message: t`Backup code is invalid`,
                }),
        })
        .strict();

    const form = useAppForm({
        defaultValues: {
            code: "",
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
                    message: getLocalizedError({ error, t }),
                    variant: "error",
                });

                form.reset();
            }
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
    });

    useEffect(() => {
        form.Subscribe({
            children: ([isFormSubmitting, isPending]) => {
                setIsSubmitting?.(Boolean(isFormSubmitting || isPending));

                return null;
            },
            selector: (state) => [state.isSubmitting, transitionPending],
        });
    }, [setIsSubmitting, transitionPending]);

    return (
        <form.AppForm>
            <form
                className={cn("grid w-full gap-6", className, classNames?.base)}
                noValidate={isHydrated}
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <form.AppField
                    children={(field) => (
                        <field.FormItem>
                            <field.FormLabel className={classNames?.label}>{t`Backup Code`}</field.FormLabel>

                            <field.FormControl>
                                <InputOTP
                                    className={classNames?.otpInput}
                                    containerClassName={classNames?.otpInputContainer}
                                    disabled={isSubmitting}
                                    maxLength={6}
                                    onChange={(value) => {
                                        field.handleChange(value);

                                        if (value.length === 6) {
                                            form.handleSubmit();
                                        }
                                    }}
                                    value={field.state.value}
                                >
                                    <OTPInputGroup otpSeparators={otpSeparators} />
                                </InputOTP>
                            </field.FormControl>

                            <field.FormMessage className={classNames?.error} />
                        </field.FormItem>
                    )}
                    name="code"
                />

                <div className="grid gap-4">
                    <form.Subscribe
                        children={([canSubmit, isFormSubmitting]) => (
                            <Button className={cn(classNames?.button, classNames?.primaryButton)} disabled={!canSubmit || isSubmitting} type="submit">
                                {(isFormSubmitting || isSubmitting) && <Loader2 className="animate-spin" />}
                                {t`Recover account`}
                            </Button>
                        )}
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                    />
                </div>
            </form>
        </form.AppForm>
    );
};
