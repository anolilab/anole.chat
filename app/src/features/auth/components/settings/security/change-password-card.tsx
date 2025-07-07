"use client";

import { useContext } from "react";
import * as z from "zod";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { getLocalizedError, getPasswordSchema } from "../../../lib/utils";
import { cn } from "@/lib/utils";
import type { AuthLocalization } from "../../../localization/auth-localization";
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
    localization?: AuthLocalization;
    skipHook?: boolean;
    passwordValidation?: PasswordValidation;
}

export function ChangePasswordCard({ className, classNames, accounts, isPending, localization, skipHook, passwordValidation }: ChangePasswordCardProps) {
    const {
        authClient,
        basePath,
        baseURL,
        credentials,
        hooks: { useSession, useListAccounts },
        localization: contextLocalization,
        viewPaths,
        toast,
    } = useContext(AuthUIContext);

    const confirmPasswordEnabled = credentials?.confirmPassword;
    const contextPasswordValidation = credentials?.passwordValidation;

    localization = { ...contextLocalization, ...localization };
    passwordValidation = { ...contextPasswordValidation, ...passwordValidation };

    const { data: sessionData } = useSession();

    if (!skipHook) {
        const result = useListAccounts();
        accounts = result.data;
        isPending = result.isPending;
    }

    const formSchema = z
        .object({
            currentPassword: getPasswordSchema(passwordValidation, localization),
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
                    message: localization.CHANGE_PASSWORD_SUCCESS!,
                });

                form.reset();
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error, localization }),
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
                    message: localization.FORGOT_PASSWORD_EMAIL!,
                });
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error, localization }),
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
                        title={localization.SET_PASSWORD}
                        description={localization.SET_PASSWORD_DESCRIPTION}
                        actionLabel={localization.SET_PASSWORD}
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
                    actionLabel={localization.SAVE}
                    description={localization.CHANGE_PASSWORD_DESCRIPTION}
                    instructions={localization.CHANGE_PASSWORD_INSTRUCTIONS}
                    isPending={isPending}
                    title={localization.CHANGE_PASSWORD}
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
                                            <field.FormLabel className={classNames?.label}>{localization.CURRENT_PASSWORD}</field.FormLabel>

                                            <field.FormControl>
                                                <PasswordInput
                                                    className={classNames?.input}
                                                    autoComplete="current-password"
                                                    placeholder={localization.CURRENT_PASSWORD_PLACEHOLDER}
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
                                            <field.FormLabel className={classNames?.label}>{localization.NEW_PASSWORD}</field.FormLabel>

                                            <field.FormControl>
                                                <PasswordInput
                                                    className={classNames?.input}
                                                    autoComplete="new-password"
                                                    placeholder={localization.NEW_PASSWORD_PLACEHOLDER}
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
                                                <field.FormLabel className={classNames?.label}>{localization.CONFIRM_PASSWORD}</field.FormLabel>

                                                <field.FormControl>
                                                    <PasswordInput
                                                        className={classNames?.input}
                                                        autoComplete="new-password"
                                                        placeholder={localization.CONFIRM_PASSWORD_PLACEHOLDER}
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
