"use client";

import { Loader2 } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { z } from "zod/v4";
import { t } from "@lingui/core/macro";

import { useIsHydrated } from "../../../../../hooks/use-hydrated";
import { useOnSuccessTransition } from "../../../hooks/use-success-transition";
import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputOTP } from "@/components/ui/input-otp";
import type { AuthFormClassNames } from "../auth-form";
import { OTPInputGroup } from "../otp-input-group";

export interface EmailOTPFormProps {
    className?: string;
    classNames?: AuthFormClassNames;
    callbackURL?: string;
    isSubmitting?: boolean;
    otpSeparators?: 0 | 1 | 2;
    redirectTo?: string;
    setIsSubmitting?: (value: boolean) => void;
}

export function EmailOTPForm(props: EmailOTPFormProps) {
    const [email, setEmail] = useState<string | undefined>();

    if (!email) {
        return <EmailForm {...props} setEmail={setEmail} />;
    }

    return <OTPForm {...props} email={email} />;
}

function EmailForm({
    className,
    classNames,
    isSubmitting,
    setIsSubmitting,
    setEmail,
}: EmailOTPFormProps & {
    setEmail: (email: string) => void;
}) {
    const isHydrated = useIsHydrated();

    const { authClient, toast } = useContext(AuthUIContext);

    const formSchema = z.object({
        email: z
            .string()
            .min(1, {
                message: t`Email is required`,
            })
            .email({
                message: t`Email is invalid`,
            }),
    });

    const form = useAppForm({
        defaultValues: {
            email: "",
        },
        validators: {
            onChange: ({ value }) => {
                const result = formSchema.safeParse(value);
                if (!result.success) {
                    return result.error.flatten().fieldErrors;
                }
                return undefined;
            },
        },
        onSubmit: async ({ value }) => {
            try {
                await authClient.emailOtp.sendVerificationOtp({
                    email: value.email,
                    type: "sign-in",
                    fetchOptions: { throw: true },
                });

                toast({
                    variant: "success",
                    message: t`Verification code sent to your email`,
                });

                setEmail(value.email);
            } catch (error) {
                toast({
                    variant: "error",
                    message: t`Failed to send verification code`,
                });
            }
        },
    });

    useEffect(() => {
        form.Subscribe({
            selector: (state) => state.isSubmitting,
            children: (isFormSubmitting) => {
                setIsSubmitting?.(isFormSubmitting);
                return null;
            },
        });
    }, [setIsSubmitting]);

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
                    name="email"
                    children={(field) => (
                        <field.FormItem>
                            <field.FormLabel className={classNames?.label}>{t`Email`}</field.FormLabel>

                            <field.FormControl>
                                <Input
                                    className={classNames?.input}
                                    type="email"
                                    autoComplete="email"
                                    placeholder={t`Enter your email address`}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </field.FormControl>

                            <field.FormMessage className={classNames?.error} />
                        </field.FormItem>
                    )}
                />

                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isFormSubmitting]) => (
                        <Button type="submit" disabled={!canSubmit || isSubmitting} className={cn("w-full", classNames?.button, classNames?.primaryButton)}>
                            {isFormSubmitting || isSubmitting ? <Loader2 className="animate-spin" /> : t`Send Verification Code`}
                        </Button>
                    )}
                />
            </form>
        </form.AppForm>
    );
}

export function OTPForm({
    className,
    classNames,
    isSubmitting,
    otpSeparators = 0,
    redirectTo,
    setIsSubmitting,
    email,
}: EmailOTPFormProps & {
    email: string;
}) {
    const { authClient, toast } = useContext(AuthUIContext);

    const { onSuccess, isPending: transitionPending } = useOnSuccessTransition({
        redirectTo,
    });

    const formSchema = z.object({
        code: z
            .string()
            .min(1, {
                message: t`Verification code is required`,
            })
            .min(6, {
                message: t`Verification code is invalid`,
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
                await authClient.signIn.emailOtp({
                    email,
                    otp: value.code,
                    fetchOptions: { throw: true },
                });

                await onSuccess();
            } catch (error) {
                toast({
                    variant: "error",
                    message: t`Invalid verification code`,
                });

                form.reset();
            }
        },
    });

    useEffect(() => {
        form.Subscribe({
            selector: (state) => [state.isSubmitting, transitionPending],
            children: ([isFormSubmitting, isPending]) => {
                setIsSubmitting?.(isFormSubmitting || isPending);
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
                className={cn("grid w-full gap-6", className, classNames?.base)}
            >
                <form.AppField
                    name="code"
                    children={(field) => (
                        <field.FormItem>
                            <field.FormLabel className={classNames?.label}>{t`Verification Code`}</field.FormLabel>

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
                                {t`Verify Code`}
                            </Button>
                        )}
                    />
                </div>
            </form>
        </form.AppForm>
    );
}
