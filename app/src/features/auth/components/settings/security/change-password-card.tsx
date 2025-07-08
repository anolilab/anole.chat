"use client";

import { useContext } from "react";
import * as z from "zod";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { getLocalizedError } from "../../../lib/utils";
import { cn } from "@/lib/utils";
import type { PasswordValidation } from "../../../types/form-validation-types";
import { PasswordInput } from "../../password-input";
import { CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppForm } from "@/components/ui/form";
import { SettingsCard, type SettingsCardClassNames } from "../shared/settings-card";

export interface ChangePasswordCardProps {
    className?: string;
    classNames?: SettingsCardClassNames;
    accounts?: { provider: string }[] | null;
    isPending?: boolean;
    skipHook?: boolean;
    passwordValidation?: PasswordValidation;
}

export function ChangePasswordCard({ className, classNames, accounts, isPending, skipHook, passwordValidation }: ChangePasswordCardProps) {
    const {
        authClient,
        basePath,
        baseURL,
        credentials,
        hooks: { useSession, useListAccounts },
        viewPaths,
        toast,
    } = useContext(AuthUIContext);

    const confirmPasswordEnabled = credentials?.confirmPassword;
    const contextPasswordValidation = credentials?.passwordValidation;

    passwordValidation = { ...contextPasswordValidation, ...passwordValidation };

    const { data: sessionData } = useSession();

    if (!skipHook) {
        const result = useListAccounts();
        accounts = result.data;
        isPending = result.isPending;
    }

    const formSchema = z
        .object({
            currentPassword: (() => {
                let schema = z.string().min(1, {
                    message: t`Current password is required`,
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
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
        validators: {
            onChange: ({ value }) => formSchema.safeParse(value),
        },
        onSubmit: async ({ value }) => {
            try {
                await authClient.changePassword({
                    currentPassword: value.currentPassword,
                    newPassword: value.newPassword,
                    revokeOtherSessions: true,
                    fetchOptions: { throw: true },
                });

                toast({
                    variant: "success",
                    message: t`Password changed successfully`,
                });

                form.reset();
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error }),
                });
            }
        },
    });

    const setPasswordForm = useAppForm({
        defaultValues: {},
        validators: {
            onChange: () => ({ success: true, data: {} }),
        },
        onSubmit: async () => {
            if (!sessionData) return;
            const email = sessionData?.user.email;

            try {
                await authClient.requestPasswordReset({
                    email,
                    redirectTo: `${baseURL}${basePath}/${viewPaths.RESET_PASSWORD}`,
                    fetchOptions: { throw: true },
                });

                toast({
                    variant: "success",
                    message: t`Password reset email sent`,
                });
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error }),
                });
            }
        },
    });

    const credentialsLinked = accounts?.some((acc) => acc.provider === "credential");

    if (!isPending && !credentialsLinked) {
        return (
            <setPasswordForm.AppForm>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPasswordForm.handleSubmit();
                    }}
                >
                    <SettingsCard
                        title={t`Set Password`}
                        description={t`Set a password for your account`}
                        actionLabel={t`Set Password`}
                        isPending={isPending}
                        className={className}
                        classNames={classNames}
                    />
                </form>
            </setPasswordForm.AppForm>
        );
    }

    return (
        <form.AppForm>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <SettingsCard
                    className={className}
                    classNames={classNames}
                    actionLabel={t`Save`}
                    description={t`Change your account password`}
                    instructions={t`Enter your current password and choose a new one`}
                    isPending={isPending}
                    title={t`Change Password`}
                >
                    <CardContent className={cn("grid gap-6", classNames?.content)}>
                        {isPending || !accounts ? (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <Skeleton className={cn("h-4 w-32", classNames?.skeleton)} />
                                    <Skeleton className={cn("h-9 w-full", classNames?.skeleton)} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Skeleton className={cn("h-4 w-32", classNames?.skeleton)} />
                                    <Skeleton className={cn("h-9 w-full", classNames?.skeleton)} />
                                </div>

                                {confirmPasswordEnabled && (
                                    <div className="flex flex-col gap-1.5">
                                        <Skeleton className={cn("h-4 w-32", classNames?.skeleton)} />
                                        <Skeleton className={cn("h-9 w-full", classNames?.skeleton)} />
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <form.AppField
                                    name="currentPassword"
                                    children={(field) => (
                                        <field.FormItem>
                                            <field.FormLabel className={classNames?.label}>{t`Current Password`}</field.FormLabel>

                                            <field.FormControl>
                                                <PasswordInput
                                                    className={classNames?.input}
                                                    autoComplete="current-password"
                                                    placeholder={t`Enter current password`}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                />
                                            </field.FormControl>

                                            <field.FormMessage className={classNames?.error} />
                                        </field.FormItem>
                                    )}
                                />

                                <form.AppField
                                    name="newPassword"
                                    children={(field) => (
                                        <field.FormItem>
                                            <field.FormLabel className={classNames?.label}>{t`New Password`}</field.FormLabel>

                                            <field.FormControl>
                                                <PasswordInput
                                                    className={classNames?.input}
                                                    autoComplete="new-password"
                                                    placeholder={t`Enter new password`}
                                                    enableToggle
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
                                                <field.FormLabel className={classNames?.label}>{t`Confirm Password`}</field.FormLabel>

                                                <field.FormControl>
                                                    <PasswordInput
                                                        className={classNames?.input}
                                                        autoComplete="new-password"
                                                        placeholder={t`Confirm new password`}
                                                        enableToggle
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
                            </>
                        )}
                    </CardContent>
                </SettingsCard>
            </form>
        </form.AppForm>
    );
}
