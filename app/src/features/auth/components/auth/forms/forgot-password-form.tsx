"use client";

import { Button } from "@anole/ui/components/button";
import { useAppForm } from "@anole/ui/components/form";
import { Input } from "@anole/ui/components/input";
import { useIsHydrated } from "@anole/ui/hooks/use-hydrated.d";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import type { BetterFetchOption } from "better-auth/react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { z } from "zod/v4";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import { useCaptcha } from "../../../hooks/use-captcha";
import { getLocalizedError } from "../../../lib/utils";
import { Captcha } from "../../captcha/captcha";
import type { AuthFormClassNames } from "../auth-form";

export interface ForgotPasswordFormProperties {
    className?: string;
    classNames?: AuthFormClassNames;
    isSubmitting?: boolean;
    setIsSubmitting?: (value: boolean) => void;
}

export const ForgotPasswordForm = ({ className, classNames, isSubmitting, setIsSubmitting }: ForgotPasswordFormProperties) => {
    const { t } = useLingui();
    const isHydrated = useIsHydrated();
    const { captchaRef, getCaptchaHeaders } = useCaptcha();

    const { authClient, basePath, baseURL, navigate, toast, viewPaths } = useAuth();

    const formSchema = z
        .object({
            email: z
                .string()
                .min(1, {
                    message: t`Email is required`,
                })
                .email({
                    message: t`Email is invalid`,
                }),
        })
        .strict();

    const form = useAppForm({
        defaultValues: {
            email: "",
        },
        onSubmit: async ({ value }) => {
            try {
                const fetchOptions: BetterFetchOption = {
                    headers: await getCaptchaHeaders("/forget-password"),
                    throw: true,
                };

                await authClient.requestPasswordReset({
                    email: value.email,
                    fetchOptions,
                    redirectTo: `${baseURL}${basePath}/${viewPaths.RESET_PASSWORD}`,
                });

                toast({
                    message: t`Email sent successfully`,
                    variant: "success",
                });

                navigate(`${basePath}/${viewPaths.SIGN_IN}${globalThis.location.search}`);
            } catch (error) {
                toast({
                    message: getLocalizedError({ error, t }),
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

                <Captcha action="/forget-password" ref={captchaRef} />

                <form.Subscribe
                    children={([canSubmit, isFormSubmitting]) => (
                        <Button className={cn("w-full", classNames?.button, classNames?.primaryButton)} disabled={!canSubmit || isSubmitting} type="submit">
                            {isFormSubmitting || isSubmitting ? <Loader2 className="animate-spin" /> : t`Forgot Password`}
                        </Button>
                    )}
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                />
            </form>
        </form.AppForm>
    );
};
