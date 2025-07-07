"use client";

import { useContext, useState } from "react";
import * as z from "zod";
import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { getLocalizedError } from "../../../lib/utils";
import { cn } from "@/lib/utils";
import { CardContent } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsCard } from "../shared/settings-card";
import type { SettingsCardProps } from "../shared/settings-card";

const formSchema = z.object({
    email: z.string().min(1, { message: "Email is required" }).email({ message: "Invalid email" }),
});

export function ChangeEmailCard({ className, classNames, localization, ...props }: SettingsCardProps) {
    const {
        authClient,
        emailVerification,
        hooks: { useSession },
        localization: contextLocalization,
        toast,
    } = useContext(AuthUIContext);

    localization = { ...contextLocalization, ...localization };

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
                    message: localization.EMAIL_IS_THE_SAME,
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
                        message: localization.EMAIL_VERIFY_CHANGE!,
                    });
                } else {
                    await refetch?.();
                    toast({
                        variant: "success",
                        message: `${localization.EMAIL} ${localization.UPDATED_SUCCESSFULLY}`,
                    });
                }
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error, localization }),
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
                    message: localization.EMAIL_VERIFICATION!,
                });
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error, localization }),
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
                        description={localization.EMAIL_DESCRIPTION}
                        instructions={localization.EMAIL_INSTRUCTIONS}
                        isPending={isPending}
                        title={localization.EMAIL}
                        actionLabel={localization.SAVE}
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
                                                    placeholder={localization.EMAIL_PLACEHOLDER}
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
                            title={localization.VERIFY_YOUR_EMAIL}
                            description={localization.VERIFY_YOUR_EMAIL_DESCRIPTION}
                            actionLabel={localization.RESEND_VERIFICATION_EMAIL}
                            disabled={resendDisabled}
                            {...props}
                        />
                    </form>
                </resendForm.AppForm>
            )}
        </>
    );
}
