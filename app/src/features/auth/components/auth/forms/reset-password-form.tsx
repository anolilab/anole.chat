"use client";

import { Loader2 } from "lucide-react";
import { useContext, useEffect, useRef } from "react";
import { z } from "zod/v4";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { getLocalizedError } from "../../../lib/utils";
import type { PasswordValidation } from "../../../types/form-validation-types";
import { PasswordInput } from "../../password-input";
import { Button } from "@/components/ui/button";
import { useAppForm } from "@/components/ui/form";
import type { AuthFormClassNames } from "../auth-form";

export interface ResetPasswordFormProps {
    className?: string;
    classNames?: AuthFormClassNames;
    passwordValidation?: PasswordValidation;
}

export function ResetPasswordForm({ className, classNames, passwordValidation }: ResetPasswordFormProps) {
    const tokenChecked = useRef(false);

    const { authClient, basePath, credentials, viewPaths, navigate, toast } = useContext(AuthUIContext);

    const confirmPasswordEnabled = credentials?.confirmPassword;
    const contextPasswordValidation = credentials?.passwordValidation;

    passwordValidation = { ...contextPasswordValidation, ...passwordValidation };

    const formSchema = z
        .object({
            newPassword: (() => {
                let schema = z.string().min(1, {
                    message: t`New password is required`,
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
            confirmPassword: confirmPasswordEnabled
                ? (() => {
                    let schema = z.string().min(1, {
                        message: t`Confirm password is required`,
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
                })()
                : z.string().optional(),
        })
        .refine((data) => !confirmPasswordEnabled || data.newPassword === data.confirmPassword, {
            message: t`Passwords do not match`,
            path: ["confirmPassword"],
        });

    const form = useAppForm({
        defaultValues: {
            newPassword: "",
            confirmPassword: "",
        },
        validators: {
            onChange: ({ value }) => {
                const result = formSchema.safeParse(value);
                if (!result.success) {
                    return result.error.issues[0]?.message;
                }
                return undefined;
            },
        },
        onSubmit: async ({ value }) => {
            try {
                const searchParams = new URLSearchParams(window.location.search);
                const token = searchParams.get("token") as string;

                await authClient.resetPassword({
                    newPassword: value.newPassword,
                    token,
                    fetchOptions: { throw: true },
                });

                toast({
                    variant: "success",
                    message: t`Password reset successful`,
                });

                navigate(`${basePath}/${viewPaths.SIGN_IN}${window.location.search}`);
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error }),
                });

                form.reset();
            }
        },
    });

    const isSubmitting = form.state.isSubmitting;

    useEffect(() => {
        if (tokenChecked.current) return;
        tokenChecked.current = true;

        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get("token");

        if (!token || token === "INVALID_TOKEN") {
            navigate(`${basePath}/${viewPaths.SIGN_IN}${window.location.search}`);
            toast({ variant: "error", message: t`Invalid token` });
        }
    }, [basePath, navigate, toast, viewPaths]);

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
                    name="newPassword"
                    children={(field) => (
                        <field.FormItem>
                            <field.FormLabel className={classNames?.label}>{t`New password`}</field.FormLabel>

                            <field.FormControl>
                                <PasswordInput
                                    autoComplete="new-password"
                                    className={classNames?.input}
                                    placeholder={t`Enter new password`}
                                    disabled={isSubmitting}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                            </field.FormControl>

                            <field.FormMessage className={classNames?.error} />
                        </field.FormItem>
                    )}
                />

                {confirmPasswordEnabled && (
                    <form.AppField
                        name="confirmPassword"
                        children={(field) => (
                            <field.FormItem>
                                <field.FormLabel className={classNames?.label}>{t`Confirm password`}</field.FormLabel>

                                <field.FormControl>
                                    <PasswordInput
                                        autoComplete="new-password"
                                        className={classNames?.input}
                                        placeholder={t`Confirm new password`}
                                        disabled={isSubmitting}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                </field.FormControl>

                                <field.FormMessage className={classNames?.error} />
                            </field.FormItem>
                        )}
                    />
                )}

                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isSubmitting]) => (
                        <Button type="submit" disabled={!canSubmit || isSubmitting} className={cn(classNames?.button, classNames?.primaryButton)}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : t`Reset password`}
                        </Button>
                    )}
                />
            </form>
        </form.AppForm>
    );
}
