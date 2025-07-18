"use client";

import { Button } from "@anole/ui/components/button";
import { Checkbox } from "@anole/ui/components/checkbox";
import { useAppForm } from "@anole/ui/components/form";
import { PasswordInput } from "@anole/ui/components/form/password-input";
import { Input } from "@anole/ui/components/input";
import { useIsHydrated } from "@anole/ui/hooks/use-hydrated";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import type { BetterFetchOption } from "better-auth/react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { z } from "zod/v4";

import { useCaptcha } from "@/features/auth/hooks/use-captcha";
import { useLastSignInMethod } from "@/features/auth/hooks/use-last-signin-method";
import { useOnSuccessTransition } from "@/features/auth/hooks/use-success-transition";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { getLocalizedError, isValidEmail } from "@/features/auth/lib/utils";
import type { PasswordValidation } from "@/features/auth/types/form-validation-types";
import emailSchema from "@/features/auth/validators/email-schema";

import { Captcha } from "../../captcha/captcha";
import type { AuthFormClassNames } from "../auth-form";
import { LastSignInMessage } from "../last-signin-message";

export interface SignInFormProperties {
    className?: string;
    classNames?: AuthFormClassNames;
    isSubmitting?: boolean;
    passwordValidation?: PasswordValidation;
    redirectTo?: string;
    setIsSubmitting?: (isSubmitting: boolean) => void;
}

export const SignInForm = ({ className, classNames, isSubmitting, passwordValidation, redirectTo, setIsSubmitting }: SignInFormProperties) => {
    const { t } = useLingui();
    const isHydrated = useIsHydrated();
    const { captchaRef, getCaptchaHeaders } = useCaptcha();
    const { saveLastSignIn } = useLastSignInMethod();

    const { authClient, basePath, credentials, navigate, toast, viewPaths } = useAuth();

    const rememberMeEnabled = credentials?.rememberMe;
    const usernameEnabled = credentials?.username;
    const contextPasswordValidation = credentials?.passwordValidation;

    const finalPasswordValidation = { ...contextPasswordValidation, ...passwordValidation };

    const { isPending: transitionPending, onSuccess } = useOnSuccessTransition({
        redirectTo,
    });

    const formSchema = z
        .object({
            email: usernameEnabled
                ? z.string().min(1, {
                    message: t`Username is required`,
                })
                : emailSchema,
            password: (() => {
                let schema = z.string().min(1, {
                    message: t`Password is required`,
                });

                if (finalPasswordValidation?.minLength) {
                    schema = schema.min(finalPasswordValidation.minLength, {
                        message: t`Password is too short`,
                    });
                }

                if (finalPasswordValidation?.maxLength) {
                    schema = schema.max(finalPasswordValidation.maxLength, {
                        message: t`Password is too long`,
                    });
                }

                if (finalPasswordValidation?.regex) {
                    schema = schema.regex(finalPasswordValidation.regex, {
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

                    // Save last sign-in method
                    saveLastSignIn("username", value.email);
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

                    // Save last sign-in method
                    saveLastSignIn("email", value.email);
                }

                if (response.twoFactorRedirect) {
                    navigate(`${basePath}/${viewPaths.TWO_FACTOR}${globalThis.location.search}`);
                } else {
                    await onSuccess();
                }
            } catch (error) {
                form.setFieldValue("password", "");

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
            children: ([isFormSubmitting, isPending]) => {
                setIsSubmitting?.(Boolean(isFormSubmitting || isPending));

                return undefined;
            },
            selector: (state) => [state.isSubmitting, transitionPending],
        });
    }, [form, setIsSubmitting, transitionPending]);

    return (
        <form.AppForm>
            <form
                className={cn("grid w-full gap-6", className, classNames?.base)}
                noValidate={isHydrated}
                onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    form.handleSubmit();
                }}
            >
                {/* Last Sign-In Message */}
                <LastSignInMessage
                    className="mb-2"
                    classNames={{
                        container: "justify-center",
                        text: "text-center",
                    }}
                />

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
                                    onChange={(event) => {
                                        field.handleChange(event.target.value);
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
                                    onChange={(event) => {
                                        field.handleChange(event.target.value);
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
