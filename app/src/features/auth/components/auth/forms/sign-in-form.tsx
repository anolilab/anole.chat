"use client";

import { t } from "@lingui/core/macro";
import { Link } from "@tanstack/react-router";
import type { BetterFetchOption } from "better-auth/react";
import { Loader2 } from "lucide-react";
import { use, useEffect } from "react";
import { z } from "zod/v4";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import { useIsHydrated } from "../../../../../hooks/use-hydrated";
import { useCaptcha } from "../../../hooks/use-captcha";
import { useOnSuccessTransition } from "../../../hooks/use-success-transition";
import { getLocalizedError, isValidEmail } from "../../../lib/utils";
import type { PasswordValidation } from "../../../types/form-validation-types";
import { Captcha } from "../../captcha/captcha";
import { PasswordInput } from "../../password-input";
import type { AuthFormClassNames } from "../auth-form";

export interface SignInFormProperties {
    className?: string;
    classNames?: AuthFormClassNames;
    isSubmitting?: boolean;
    passwordValidation?: PasswordValidation;
    redirectTo?: string;
    setIsSubmitting?: (isSubmitting: boolean) => void;
}

export const SignInForm = ({ className, classNames, isSubmitting, passwordValidation, redirectTo, setIsSubmitting }: SignInFormProperties) => {
    const isHydrated = useIsHydrated();
    const { captchaRef, getCaptchaHeaders } = useCaptcha();

    const { authClient, basePath, credentials, navigate, toast, viewPaths } = useAuth();

    const rememberMeEnabled = credentials?.rememberMe;
    const usernameEnabled = credentials?.username;
    const contextPasswordValidation = credentials?.passwordValidation;

    passwordValidation = { ...contextPasswordValidation, ...passwordValidation };

    const { isPending: transitionPending, onSuccess } = useOnSuccessTransition({
        redirectTo,
    });

    const formSchema = z
        .object({
            email: usernameEnabled
                ? z.string().min(1, {
                    message: t`Username is required`,
                })
                : z
                    .string()
                    .min(1, {
                        message: t`Email is required`,
                    })
                    .email({
                        message: t`Email is invalid`,
                    }),
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
            rememberMe: z.boolean().optional(),
        })
        .strict();

    const form = useAppForm({
        defaultValues: {
            email: "",
            password: "",
            rememberMe: !rememberMeEnabled,
        },
        onSubmit: async ({ value }) => {
            try {
                let response: Record<string, unknown> = {};

                if (usernameEnabled && !isValidEmail(value.email)) {
                    const fetchOptions: BetterFetchOption = {
                        headers: await getCaptchaHeaders("/sign-in/username"),
                        throw: true,
                    };

                    response = await authClient.signIn.username({
                        fetchOptions,
                        password: value.password,
                        rememberMe: value.rememberMe,
                        username: value.email,
                    });
                } else {
                    const fetchOptions: BetterFetchOption = {
                        headers: await getCaptchaHeaders("/sign-in/email"),
                        throw: true,
                    };

                    response = await authClient.signIn.email({
                        email: value.email,
                        fetchOptions,
                        password: value.password,
                        rememberMe: value.rememberMe,
                    });
                }

                if (response.twoFactorRedirect) {
                    navigate(`${basePath}/${viewPaths.TWO_FACTOR}${globalThis.location.search}`);
                } else {
                    await onSuccess();
                }
            } catch (error) {
                form.setFieldValue("password", "");

                toast({
                    message: getLocalizedError({ error }),
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
            children: ([isFormSubmitting, isPending]) => {
                setIsSubmitting?.(Boolean(isFormSubmitting || isPending));

                return null;
            },
            selector: (state) => [state.isSubmitting, transitionPending],
        });
    }, [setIsSubmitting, transitionPending]);

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
                            <field.FormLabel className={classNames?.label}>{usernameEnabled ? t`Username` : t`Email`}</field.FormLabel>

                            <field.FormControl>
                                <Input
                                    autoComplete={usernameEnabled ? "username" : "email"}
                                    className={classNames?.input}
                                    disabled={isSubmitting}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                    }}
                                    placeholder={usernameEnabled ? t`Enter your username` : t`Enter your email`}
                                    type={usernameEnabled ? "text" : "email"}
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
                            <div className="flex items-center justify-between">
                                <field.FormLabel className={classNames?.label}>{t`Password`}</field.FormLabel>

                                {credentials?.forgotPassword && (
                                    <Link
                                        className={cn("text-sm hover:underline", classNames?.forgotPasswordLink)}
                                        to={`${basePath}/${viewPaths.FORGOT_PASSWORD}${isHydrated ? globalThis.location.search : ""}`}
                                    >
                                        {t`Forgot password?`}
                                    </Link>
                                )}
                            </div>

                            <field.FormControl>
                                <PasswordInput
                                    autoComplete="current-password"
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

                {rememberMeEnabled && (
                    <form.AppField
                        children={(field) => (
                            <field.FormItem className="flex">
                                <field.FormControl>
                                    <Checkbox
                                        checked={field.state.value}
                                        disabled={isSubmitting}
                                        onCheckedChange={(checked) => {
                                            field.handleChange(checked === true);
                                        }}
                                    />
                                </field.FormControl>

                                <field.FormLabel>{t`Remember me`}</field.FormLabel>
                            </field.FormItem>
                        )}
                        name="rememberMe"
                    />
                )}

                <Captcha action="/sign-in/email" ref={captchaRef} />

                <form.Subscribe
                    children={([canSubmit, isFormSubmitting]) => (
                        <Button className={cn("w-full", classNames?.button, classNames?.primaryButton)} disabled={!canSubmit || isSubmitting} type="submit">
                            {isFormSubmitting || isSubmitting ? <Loader2 className="animate-spin" /> : t`Sign in`}
                        </Button>
                    )}
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                />
            </form>
        </form.AppForm>
    );
};
