"use client";

import { Button } from "@anole/ui/components/button";
import { useAppForm } from "@anole/ui/components/form";
import { Input } from "@anole/ui/components/input";
import { InputOTP } from "@anole/ui/components/input-otp";
import { useIsHydrated } from "@anole/ui/hooks/use-hydrated";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod/v4";

import { useOnSuccessTransition } from "@/features/auth/hooks/use-success-transition";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import emailSchema from "@/features/auth/validators/email-schema";

import type { AuthFormClassNames } from "../auth-form";
import { OTPInputGroup } from "../otp-input-group";

export interface EmailOTPFormProperties {
    callbackURL?: string;
    className?: string;
    classNames?: AuthFormClassNames;
    isSubmitting?: boolean;
    otpSeparators?: 0 | 1 | 2;
    redirectTo?: string;
    setIsSubmitting?: (value: boolean) => void;
}

export const EmailOTPForm = (properties: EmailOTPFormProperties) => {
    const [email, setEmail] = useState<string | undefined>();

    if (!email) {
        return <EmailForm {...properties} setEmail={setEmail} />;
    }

    return <OTPForm {...properties} email={email} />;
};

const EmailForm = ({
    className,
    classNames,
    isSubmitting,
    setEmail,
    setIsSubmitting,
}: EmailOTPFormProperties & {
    setEmail: (email: string) => void;
}) => {
    const { t } = useLingui();
    const isHydrated = useIsHydrated();

    const { authClient, toast } = useAuth();

    const formSchema = z
        .object({
            email: emailSchema,
        })
        .strict();

    const form = useAppForm({
        defaultValues: {
            email: "",
        },
        onSubmit: async ({ value }) => {
            try {
                await authClient.emailOtp.sendVerificationOtp({
                    email: value.email,
                    fetchOptions: { throw: true },
                    type: "sign-in",
                });

                toast({
                    message: t`Verification code sent to your email`,
                    variant: "success",
                });

                setEmail(value.email);
            } catch {
                toast({
                    message: t`Failed to send verification code`,
                    variant: "error",
                });
            }
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
    });

    useEffect(() => {
        form.Subscribe({
            children: (isFormSubmitting) => {
                setIsSubmitting?.(isFormSubmitting);

                return null;
            },
            selector: (state) => state.isSubmitting,
        });
    }, [setIsSubmitting]);

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
                            <field.FormLabel className={classNames?.label}>{t`Email`}</field.FormLabel>

                            <field.FormControl>
                                <Input
                                    autoComplete="email"
                                    className={classNames?.input}
                                    disabled={isSubmitting}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                    }}
                                    placeholder={t`Enter your email address`}
                                    type="email"
                                    value={field.state.value}
                                />
                            </field.FormControl>

                            <field.FormMessage className={classNames?.error} />
                        </field.FormItem>
                    )}
                    name="email"
                />

                <form.Subscribe
                    children={([canSubmit, isFormSubmitting]) => (
                        <Button className={cn("w-full", classNames?.button, classNames?.primaryButton)} disabled={!canSubmit || isSubmitting} type="submit">
                            {isFormSubmitting || isSubmitting ? <Loader2 className="animate-spin" /> : t`Send Verification Code`}
                        </Button>
                    )}
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                />
            </form>
        </form.AppForm>
    );
};

export const OTPForm = ({
    className,
    classNames,
    email,
    isSubmitting,
    otpSeparators = 0,
    redirectTo,
    setIsSubmitting,
}: EmailOTPFormProperties & {
    email: string;
}) => {
    const { authClient, toast } = useAuth();

    const { isPending: transitionPending, onSuccess } = useOnSuccessTransition({
        redirectTo,
    });

    const formSchema = z
        .object({
            code: z
                .string()
                .min(1, {
                    message: t`Verification code is required`,
                })
                .min(6, {
                    message: t`Verification code is invalid`,
                }),
        })
        .strict();

    const form = useAppForm({
        defaultValues: {
            code: "",
        },
        onSubmit: async ({ value }: { value: { code: string } }) => {
            try {
                await authClient.signIn.emailOtp({
                    email,
                    fetchOptions: { throw: true },
                    otp: value.code,
                });

                await onSuccess();
            } catch {
                toast({
                    message: t`Invalid verification code`,
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
                setIsSubmitting?.(isFormSubmitting || isPending);

                return null;
            },
            selector: (state) => [state.isSubmitting, transitionPending],
        });
    }, [setIsSubmitting, transitionPending]);

    return (
        <form.AppForm>
            <form
                className={cn("grid w-full gap-6", className, classNames?.base)}
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <form.AppField
                    children={(field) => (
                        <field.FormItem>
                            <field.FormLabel className={classNames?.label}>{t`Verification Code`}</field.FormLabel>

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
                                {t`Verify Code`}
                            </Button>
                        )}
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                    />
                </div>
            </form>
        </form.AppForm>
    );
};
