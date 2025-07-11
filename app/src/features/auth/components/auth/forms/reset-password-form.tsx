"use client";

import { t } from "@lingui/core/macro";
import { Loader2 } from "lucide-react";
import { use, useEffect, useRef } from "react";
import { z } from "zod/v4";

import { Button } from "@/components/ui/button";
import { useAppForm } from "@/components/ui/form";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import { getLocalizedError } from "../../../lib/utils";
import type { PasswordValidation } from "../../../types/form-validation-types";
import { PasswordInput } from "../../password-input";
import type { AuthFormClassNames } from "../auth-form";

export interface ResetPasswordFormProperties {
    className?: string;
    classNames?: AuthFormClassNames;
    passwordValidation?: PasswordValidation;
}

export const ResetPasswordForm = ({ className, classNames, passwordValidation }: ResetPasswordFormProperties) => {
    const tokenChecked = useRef(false);

    const { authClient, basePath, credentials, navigate, toast, viewPaths } = useAuth();

    const confirmPasswordEnabled = credentials?.confirmPassword;
    const contextPasswordValidation = credentials?.passwordValidation;

    passwordValidation = { ...contextPasswordValidation, ...passwordValidation };

    const formSchema = z
        .object({
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
        })
        .refine((data) => !confirmPasswordEnabled || data.newPassword === data.confirmPassword, {
            message: t`Passwords do not match`,
            path: ["confirmPassword"],
        });

    const form = useAppForm({
        defaultValues: {
            confirmPassword: "",
            newPassword: "",
        },
        onSubmit: async ({ value }) => {
            try {
                const searchParameters = new URLSearchParams(globalThis.location.search);
                const token = searchParameters.get("token") as string;

                await authClient.resetPassword({
                    fetchOptions: { throw: true },
                    newPassword: value.newPassword,
                    token,
                });

                toast({
                    message: t`Password reset successful`,
                    variant: "success",
                });

                navigate(`${basePath}/${viewPaths.SIGN_IN}${globalThis.location.search}`);
            } catch (error) {
                toast({
                    message: getLocalizedError({ error }),
                    variant: "error",
                });

                form.reset();
            }
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
    });

    const { isSubmitting } = form.state;

    useEffect(() => {
        if (tokenChecked.current)
            return;

        tokenChecked.current = true;

        const searchParameters = new URLSearchParams(globalThis.location.search);
        const token = searchParameters.get("token");

        if (!token || token === "INVALID_TOKEN") {
            navigate(`${basePath}/${viewPaths.SIGN_IN}${globalThis.location.search}`);
            toast({ message: t`Invalid token`, variant: "error" });
        }
    }, [basePath, navigate, toast, viewPaths]);

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
                            <field.FormLabel className={classNames?.label}>{t`New password`}</field.FormLabel>

                            <field.FormControl>
                                <PasswordInput
                                    autoComplete="new-password"
                                    className={classNames?.input}
                                    disabled={isSubmitting}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => { field.handleChange(e.target.value); }}
                                    placeholder={t`Enter new password`}
                                    value={field.state.value}
                                />
                            </field.FormControl>

                            <field.FormMessage className={classNames?.error} />
                        </field.FormItem>
                    )}
                    name="newPassword"
                />

                {confirmPasswordEnabled && (
                    <form.AppField
                        children={(field) => (
                            <field.FormItem>
                                <field.FormLabel className={classNames?.label}>{t`Confirm password`}</field.FormLabel>

                                <field.FormControl>
                                    <PasswordInput
                                        autoComplete="new-password"
                                        className={classNames?.input}
                                        disabled={isSubmitting}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => { field.handleChange(e.target.value); }}
                                        placeholder={t`Confirm new password`}
                                        value={field.state.value}
                                    />
                                </field.FormControl>

                                <field.FormMessage className={classNames?.error} />
                            </field.FormItem>
                        )}
                        name="confirmPassword"
                    />
                )}

                <form.Subscribe
                    children={([canSubmit, isSubmitting]) => (
                        <Button className={cn(classNames?.button, classNames?.primaryButton)} disabled={!canSubmit || isSubmitting} type="submit">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : t`Reset password`}
                        </Button>
                    )}
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                />
            </form>
        </form.AppForm>
    );
};
