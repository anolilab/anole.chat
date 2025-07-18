"use client";

import { Alert, AlertDescription } from "@anole/ui/components/alert";
import { Button } from "@anole/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@anole/ui/components/card";
import { useAppForm } from "@anole/ui/components/form";
import { PasswordInput } from "@anole/ui/components/form/password-input";
import { Input } from "@anole/ui/components/input";
import { useIsHydrated } from "@anole/ui/hooks/use-hydrated";
import cn from "@anole/ui/utils/cn";
import { t } from "@lingui/core/macro";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod/v4";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { getLocalizedError } from "@/features/auth/lib/utils";
import type { PasswordValidation } from "@/features/auth/types/form-validation-types";
import emailSchema from "@/features/auth/validators/email-schema";

export interface ConvertAnonymousAccountProperties {
    className?: string;
    classNames?: {
        alert?: string;
        base?: string;
        button?: string;
        card?: string;
        cardContent?: string;
        cardDescription?: string;
        cardHeader?: string;
        cardTitle?: string;
        error?: string;
        form?: string;
        input?: string;
        label?: string;
    };
    onSuccess?: () => void;
    passwordValidation?: PasswordValidation;
}

export const ConvertAnonymousAccount = ({ className, classNames, onSuccess, passwordValidation }: ConvertAnonymousAccountProperties) => {
    const isHydrated = useIsHydrated();
    const { authClient, toast } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formSchema = z
        .object({
            confirmPassword: z.string().min(1, {
                message: t`Please confirm your password`,
            }),
            email: emailSchema,
            password: (() => {
                let schema = z.string().min(1, {
                    message: t`Password is required`,
                });

                if (passwordValidation?.minLength) {
                    schema = schema.min(passwordValidation.minLength, {
                        message: t`Password is too short`,
                    });
                }

                if (passwordValidation?.maxLength) {
                    schema = schema.max(passwordValidation.maxLength, {
                        message: t`Password is too long`,
                    });
                }

                if (passwordValidation?.regex) {
                    schema = schema.regex(passwordValidation.regex, {
                        message: t`Invalid password`,
                    });
                }

                return schema;
            })(),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t`Passwords do not match`,
            path: ["confirmPassword"],
        })
        .strict();

    const form = useAppForm({
        defaultValues: {
            confirmPassword: "",
            email: "",
            password: "",
        },
        onSubmit: async ({ value }) => {
            try {
                setIsSubmitting(true);

                await authClient.signUp.email({
                    email: value.email,
                    password: value.password,
                    throw: true,
                });

                toast({
                    message: t`Account converted successfully! Please check your email to verify your account.`,
                    variant: "default",
                });

                onSuccess?.();
            } catch (error) {
                toast({
                    message: getLocalizedError({ error }),
                    variant: "error",
                });
            } finally {
                setIsSubmitting(false);
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
            children: ([isFormSubmitting]) => {
                setIsSubmitting(Boolean(isFormSubmitting));

                return null;
            },
            selector: (state) => [state.isSubmitting],
        });
    }, []);

    return (
        <Card className={cn("w-full max-w-md", className, classNames?.base)}>
            <CardHeader className={classNames?.cardHeader}>
                <CardTitle className={cn("text-lg", classNames?.cardTitle)}>{t`Convert to Full Account`}</CardTitle>
                <CardDescription className={classNames?.cardDescription}>
                    {t`Create a permanent account to save your data and access it from any device.`}
                </CardDescription>
            </CardHeader>

            <CardContent className={cn("grid gap-4", classNames?.cardContent)}>
                <Alert className={cn("text-sm", classNames?.alert)}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{t`Your current anonymous session will be converted to a permanent account.`}</AlertDescription>
                </Alert>

                <form.AppForm>
                    <form
                        className={cn("grid gap-4", classNames?.form)}
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
                                            placeholder={t`Enter your email`}
                                            type="email"
                                            value={field.state.value}
                                        />
                                    </field.FormControl>
                                    <field.FormMessage className={classNames?.error} />
                                </field.FormItem>
                            )}
                            name="email"
                        />

                        <form.AppField
                            children={(field) => (
                                <field.FormItem>
                                    <field.FormLabel className={classNames?.label}>{t`Password`}</field.FormLabel>
                                    <field.FormControl>
                                        <PasswordInput
                                            className={classNames?.input}
                                            disabled={isSubmitting}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => {
                                                field.handleChange(e.target.value);
                                            }}
                                            placeholder={t`Enter your password`}
                                            value={field.state.value}
                                        />
                                    </field.FormControl>
                                    <field.FormMessage className={classNames?.error} />
                                </field.FormItem>
                            )}
                            name="password"
                        />

                        <form.AppField
                            children={(field) => (
                                <field.FormItem>
                                    <field.FormLabel className={classNames?.label}>{t`Confirm Password`}</field.FormLabel>
                                    <field.FormControl>
                                        <PasswordInput
                                            className={classNames?.input}
                                            disabled={isSubmitting}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => {
                                                field.handleChange(e.target.value);
                                            }}
                                            placeholder={t`Confirm your password`}
                                            value={field.state.value}
                                        />
                                    </field.FormControl>
                                    <field.FormMessage className={classNames?.error} />
                                </field.FormItem>
                            )}
                            name="confirmPassword"
                        />

                        <Button className={cn("w-full", classNames?.button)} disabled={isSubmitting} type="submit">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {t`Convert Account`}
                        </Button>
                    </form>
                </form.AppForm>
            </CardContent>
        </Card>
    );
};
