"use client";

import type { BetterFetchOption } from "better-auth/react";
import { Loader2 } from "lucide-react";
import { useContext, useEffect } from "react";
import { z } from "zod/v4";

import { useCaptcha } from "../../../hooks/use-captcha";
import { useIsHydrated } from "../../../../../hooks/use-hydrated";
import { useOnSuccessTransition } from "../../../hooks/use-success-transition";
import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { getLocalizedError, isValidEmail } from "../../../lib/utils";

import type { PasswordValidation } from "../../../types/form-validation-types";
import { Captcha } from "../../captcha/captcha";
import { PasswordInput } from "../../password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { AuthFormClassNames } from "../auth-form";
import { t } from "@lingui/core/macro";

export interface SignInFormProps {
    className?: string;
    classNames?: AuthFormClassNames;
    isSubmitting?: boolean;
    redirectTo?: string;
    setIsSubmitting?: (isSubmitting: boolean) => void;
    passwordValidation?: PasswordValidation;
}

export function SignInForm({ className, classNames, isSubmitting, redirectTo, setIsSubmitting, passwordValidation }: SignInFormProps) {
    const isHydrated = useIsHydrated();
    const { captchaRef, getCaptchaHeaders } = useCaptcha();

    const { authClient, basePath, credentials, viewPaths, navigate, toast, Link } = useContext(AuthUIContext);

    const rememberMeEnabled = credentials?.rememberMe;
    const usernameEnabled = credentials?.username;
    const contextPasswordValidation = credentials?.passwordValidation;

    passwordValidation = { ...contextPasswordValidation, ...passwordValidation };

    const { onSuccess, isPending: transitionPending } = useOnSuccessTransition({
        redirectTo,
    });

    const formSchema = z.object({
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
    });

    const form = useAppForm({
        defaultValues: {
            email: "",
            password: "",
            rememberMe: rememberMeEnabled ? false : true,
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
                let response: Record<string, unknown> = {};

                if (usernameEnabled && !isValidEmail(value.email)) {
                    const fetchOptions: BetterFetchOption = {
                        throw: true,
                        headers: await getCaptchaHeaders("/sign-in/username"),
                    };

                    response = await authClient.signIn.username({
                        username: value.email,
                        password: value.password,
                        rememberMe: value.rememberMe,
                        fetchOptions,
                    });
                } else {
                    const fetchOptions: BetterFetchOption = {
                        throw: true,
                        headers: await getCaptchaHeaders("/sign-in/email"),
                    };

                    response = await authClient.signIn.email({
                        email: value.email,
                        password: value.password,
                        rememberMe: value.rememberMe,
                        fetchOptions,
                    });
                }

                if (response.twoFactorRedirect) {
                    navigate(`${basePath}/${viewPaths.TWO_FACTOR}${window.location.search}`);
                } else {
                    await onSuccess();
                }
            } catch (error) {
                form.setFieldValue("password", "");

                toast({
                    variant: "error",
                    message: getLocalizedError({ error }),
                });
            }
        },
    });

    useEffect(() => {
        form.Subscribe({
            selector: (state) => [state.isSubmitting, transitionPending],
            children: ([isFormSubmitting, isPending]) => {
                setIsSubmitting?.(Boolean(isFormSubmitting || isPending));
                return null;
            },
        });
    }, [setIsSubmitting, transitionPending]);

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
                            <field.FormLabel className={classNames?.label}>{usernameEnabled ? t`Username` : t`Email`}</field.FormLabel>

                            <field.FormControl>
                                <Input
                                    autoComplete={usernameEnabled ? "username" : "email"}
                                    className={classNames?.input}
                                    type={usernameEnabled ? "text" : "email"}
                                    placeholder={usernameEnabled ? t`Enter your username` : t`Enter your email`}
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

                <form.AppField
                    name="password"
                    children={(field) => (
                        <field.FormItem>
                            <div className="flex items-center justify-between">
                                <field.FormLabel className={classNames?.label}>{t`Password`}</field.FormLabel>

                                {credentials?.forgotPassword && (
                                    <Link
                                        className={cn("text-sm hover:underline", classNames?.forgotPasswordLink)}
                                        href={`${basePath}/${viewPaths.FORGOT_PASSWORD}${isHydrated ? window.location.search : ""}`}
                                    >
                                        {t`Forgot password?`}
                                    </Link>
                                )}
                            </div>

                            <field.FormControl>
                                <PasswordInput
                                    autoComplete="current-password"
                                    className={classNames?.input}
                                    placeholder={t`Enter your password`}
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

                {rememberMeEnabled && (
                    <form.AppField
                        name="rememberMe"
                        children={(field) => (
                            <field.FormItem className="flex">
                                <field.FormControl>
                                    <Checkbox
                                        checked={field.state.value === true}
                                        onCheckedChange={(checked) => field.handleChange(checked === true)}
                                        disabled={isSubmitting}
                                    />
                                </field.FormControl>

                                <field.FormLabel>{t`Remember me`}</field.FormLabel>
                            </field.FormItem>
                        )}
                    />
                )}

                <Captcha ref={captchaRef} action="/sign-in/email" />

                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isFormSubmitting]) => (
                        <Button type="submit" disabled={!canSubmit || isSubmitting} className={cn("w-full", classNames?.button, classNames?.primaryButton)}>
                            {isFormSubmitting || isSubmitting ? <Loader2 className="animate-spin" /> : t`Sign in`}
                        </Button>
                    )}
                />
            </form>
        </form.AppForm>
    );
}
