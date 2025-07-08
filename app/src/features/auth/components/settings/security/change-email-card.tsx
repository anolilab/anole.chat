"use client";

import { useContext, useState } from "react";
import * as z from "zod";
import { t } from "@lingui/core/macro";
import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { CardContent } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsCard } from "../shared/settings-card";
import type { SettingsCardProps } from "../shared/settings-card";

const formSchema = z.object({
    email: z.string().min(1, { message: t`Email is required` }).email({ message: t`Invalid email` }),
});

export function ChangeEmailCard({ className, classNames, ...props }: SettingsCardProps) {
    const {
        authClient,
        emailVerification,
        hooks: { useSession },
        toast,
    } = useContext(AuthUIContext);

    const { data: sessionData, isPending, refetch } = useSession();
    const [resendDisabled, setResendDisabled] = useState(false);

    const form = useAppForm({
        defaultValues: {
            email: sessionData?.user.email || "",
        },
        validators: {
            onChange: ({ value }) => {
                const result = formSchema.safeParse(value);
                if (!result.success) {
                    return { email: result.error.issues[0]?.message };
                }
                return undefined;
            },
        },
        onSubmit: async ({ value }) => {
            if (value.email === sessionData?.user.email) {
                await new Promise((resolve) => setTimeout(resolve));
                toast({
                    variant: "error",
                    message: t`Email is the same`,
                });
                return;
            }

            try {
                await authClient.changeEmail({
                    newEmail: value.email,
                    callbackURL: window.location.pathname,
                    fetchOptions: { throw: true },
                });

                if (sessionData?.user.emailVerified) {
                    toast({
                        variant: "success",
                        message: t`Please verify your new email address`,
                    });
                } else {
                    await refetch?.();
                    toast({
                        variant: "success",
                        message: t`Email updated successfully`,
                    });
                }
            } catch (error) {
                toast({
                    variant: "error",
                    message: t`Failed to update email address`,
                });
            }
        },
    });

    const resendForm = useAppForm({
        defaultValues: {},
        onSubmit: async () => {
            if (!sessionData) return;
            const email = sessionData.user.email;

            setResendDisabled(true);

            try {
                await authClient.sendVerificationEmail({
                    email,
                    fetchOptions: { throw: true },
                });

                toast({
                    variant: "success",
                    message: t`Verification email sent`,
                });
            } catch (error) {
                toast({
                    variant: "error",
                    message: t`Failed to send verification email`,
                });
                setResendDisabled(false);
                throw error;
            }
        },
    });

    const isSubmitting = form.state.isSubmitting;

    return (
        <>
            <form.AppForm>
                <form
                    noValidate
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <SettingsCard
                        className={className}
                        classNames={classNames}
                        description={t`Update your account email address`}
                        instructions={t`Enter your new email address below`}
                        isPending={isPending}
                        title={t`Email Address`}
                        actionLabel={t`Save`}
                        {...props}
                    >
                        <CardContent className={classNames?.content}>
                            {isPending ? (
                                <Skeleton className={cn("h-9 w-full", classNames?.skeleton)} />
                            ) : (
                                <form.AppField
                                    name="email"
                                    children={(field) => (
                                        <field.FormItem>
                                            <field.FormControl>
                                                <Input
                                                    className={classNames?.input}
                                                    placeholder={t`Enter your email address`}
                                                    type="email"
                                                    autoComplete="email"
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
                        </CardContent>
                    </SettingsCard>
                </form>
            </form.AppForm>

            {emailVerification && sessionData?.user && !sessionData?.user.emailVerified && (
                <resendForm.AppForm>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            resendForm.handleSubmit();
                        }}
                    >
                        <SettingsCard
                            className={className}
                            classNames={classNames}
                            title={t`Verify Your Email`}
                            description={t`Please check your email and click the verification link`}
                            actionLabel={t`Resend Verification Email`}
                            disabled={resendDisabled}
                            {...props}
                        />
                    </form>
                </resendForm.AppForm>
            )}
        </>
    );
}
