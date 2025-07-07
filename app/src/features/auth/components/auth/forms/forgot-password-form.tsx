"use client";

import { Loader2 } from "lucide-react";
import { useContext, useEffect } from "react";
import * as z from "zod";
import { useCaptcha } from "../../../hooks/use-captcha";
import { useIsHydrated } from "../../../hooks/use-hydrated";
import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { getLocalizedError } from "../../../lib/utils";
import type { AuthLocalization } from "../../../localization/auth-localization";
import { Captcha } from "../../captcha/captcha";
import { Button } from "@/components/ui/button";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { AuthFormClassNames } from "../auth-form";
import type { BetterFetchOption } from "better-auth/react";

export interface ForgotPasswordFormProps {
    className?: string;
    classNames?: AuthFormClassNames;
    isSubmitting?: boolean;
    localization: Partial<AuthLocalization>;
    setIsSubmitting?: (value: boolean) => void;
}

export function ForgotPasswordForm({ className, classNames, isSubmitting, localization, setIsSubmitting }: ForgotPasswordFormProps) {
    const isHydrated = useIsHydrated();
    const { captchaRef, getCaptchaHeaders } = useCaptcha({ localization });

    const { authClient, basePath, baseURL, localization: contextLocalization, navigate, toast, viewPaths } = useContext(AuthUIContext);

    localization = { ...contextLocalization, ...localization };

    const formSchema = z.object({
        email: z
            .string()
            .min(1, {
                message: `${localization.EMAIL} ${localization.IS_REQUIRED}`,
            })
            .email({
                message: `${localization.EMAIL} ${localization.IS_INVALID}`,
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
                const fetchOptions: BetterFetchOption = {
                    throw: true,
                    headers: await getCaptchaHeaders("/forget-password"),
                };

                await authClient.requestPasswordReset({
                    email: value.email,
                    redirectTo: `${baseURL}${basePath}/${viewPaths.RESET_PASSWORD}`,
                    fetchOptions,
                });

                toast({
                    variant: "success",
                    message: localization.FORGOT_PASSWORD_EMAIL,
                });

                navigate(`${basePath}/${viewPaths.SIGN_IN}${window.location.search}`);
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error, localization }),
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
                            <field.FormLabel className={classNames?.label}>{localization.EMAIL}</field.FormLabel>

                            <field.FormControl>
                                <Input
                                    className={classNames?.input}
                                    type="email"
                                    autoComplete="email"
                                    placeholder={localization.EMAIL_PLACEHOLDER}
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

                <Captcha ref={captchaRef} localization={localization} action="/forget-password" />

                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isFormSubmitting]) => (
                        <Button type="submit" disabled={!canSubmit || isSubmitting} className={cn("w-full", classNames?.button, classNames?.primaryButton)}>
                            {isFormSubmitting || isSubmitting ? <Loader2 className="animate-spin" /> : localization.FORGOT_PASSWORD_ACTION}
                        </Button>
                    )}
                />
            </form>
        </form.AppForm>
    );
}
