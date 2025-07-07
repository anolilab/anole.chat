"use client";

import { Loader2 } from "lucide-react";
import { useContext, useEffect, useRef } from "react";
import * as z from "zod";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { getLocalizedError, getPasswordSchema } from "../../../lib/utils";
import type { AuthLocalization } from "../../../localization/auth-localization";
import type { PasswordValidation } from "../../../types/form-validation-types";
import { PasswordInput } from "../../password-input";
import { Button } from "@/components/ui/button";
import { useAppForm } from "@/components/ui/form";
import type { AuthFormClassNames } from "../auth-form";

export interface ResetPasswordFormProps {
    className?: string;
    classNames?: AuthFormClassNames;
    localization: Partial<AuthLocalization>;
    passwordValidation?: PasswordValidation;
}

export function ResetPasswordForm({ className, classNames, localization, passwordValidation }: ResetPasswordFormProps) {
    const tokenChecked = useRef(false);

    const { authClient, basePath, credentials, localization: contextLocalization, viewPaths, navigate, toast } = useContext(AuthUIContext);

    const confirmPasswordEnabled = credentials?.confirmPassword;
    const contextPasswordValidation = credentials?.passwordValidation;

    localization = { ...contextLocalization, ...localization };
    passwordValidation = { ...contextPasswordValidation, ...passwordValidation };

    const formSchema = z
        .object({
            newPassword: getPasswordSchema(passwordValidation, {
                PASSWORD_REQUIRED: localization.NEW_PASSWORD_REQUIRED,
                PASSWORD_TOO_SHORT: localization.PASSWORD_TOO_SHORT,
                PASSWORD_TOO_LONG: localization.PASSWORD_TOO_LONG,
                INVALID_PASSWORD: localization.INVALID_PASSWORD,
            }),
            confirmPassword: confirmPasswordEnabled
                ? getPasswordSchema(passwordValidation, {
                      PASSWORD_REQUIRED: localization.CONFIRM_PASSWORD_REQUIRED,
                      PASSWORD_TOO_SHORT: localization.PASSWORD_TOO_SHORT,
                      PASSWORD_TOO_LONG: localization.PASSWORD_TOO_LONG,
                      INVALID_PASSWORD: localization.INVALID_PASSWORD,
                  })
                : z.string().optional(),
        })
        .refine((data) => !confirmPasswordEnabled || data.newPassword === data.confirmPassword, {
            message: localization.PASSWORDS_DO_NOT_MATCH,
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
                    message: localization.RESET_PASSWORD_SUCCESS,
                });

                navigate(`${basePath}/${viewPaths.SIGN_IN}${window.location.search}`);
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error, localization }),
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
            toast({ variant: "error", message: localization.INVALID_TOKEN });
        }
    }, [basePath, navigate, toast, viewPaths, localization]);

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
                            <field.FormLabel className={classNames?.label}>{localization.NEW_PASSWORD}</field.FormLabel>

                            <field.FormControl>
                                <PasswordInput
                                    autoComplete="new-password"
                                    className={classNames?.input}
                                    placeholder={localization.NEW_PASSWORD_PLACEHOLDER}
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
                                <field.FormLabel className={classNames?.label}>{localization.CONFIRM_PASSWORD}</field.FormLabel>

                                <field.FormControl>
                                    <PasswordInput
                                        autoComplete="new-password"
                                        className={classNames?.input}
                                        placeholder={localization.CONFIRM_PASSWORD_PLACEHOLDER}
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
                            {isSubmitting ? <Loader2 className="animate-spin" /> : localization.RESET_PASSWORD_ACTION}
                        </Button>
                    )}
                />
            </form>
        </form.AppForm>
    );
}
