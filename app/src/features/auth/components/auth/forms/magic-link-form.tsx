"use client";

import { Button } from "@anole/ui/components/button";
import { useAppForm } from "@anole/ui/components/form";
import { Input } from "@anole/ui/components/input";
import { useIsHydrated } from "@anole/ui/hooks/use-hydrated";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { useSearch } from "@tanstack/react-router";
import type { BetterFetchOption } from "better-auth/react";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect } from "react";
import { z } from "zod/v4";

import { useCaptcha } from "@/features/auth/hooks/use-captcha";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { getLocalizedError } from "@/features/auth/lib/utils";
import emailSchema from "@/features/auth/validators/email-schema";

import { Captcha } from "../../captcha/captcha";
import type { AuthFormClassNames } from "../auth-form";

export interface MagicLinkFormProperties {
    callbackURL?: string;
    className?: string;
    classNames?: AuthFormClassNames;
    isSubmitting?: boolean;
    redirectTo?: string;
    setIsSubmitting?: (value: boolean) => void;
}

export const MagicLinkForm = ({
    callbackURL: callbackURLProperty,
    className,
    classNames,
    isSubmitting,
    redirectTo: redirectToProperty,
    setIsSubmitting,
}: MagicLinkFormProperties) => {
    const { t } = useLingui();
    const isHydrated = useIsHydrated();
    const { captchaRef, getCaptchaHeaders } = useCaptcha();

    const { authClient, basePath, baseURL, persistClient, redirectTo: contextRedirectTo, toast, viewPaths } = useAuth();

    const search = useSearch({ strict: false });

    const getRedirectTo = useCallback(
        () => redirectToProperty || search.redirectTo || contextRedirectTo,
        [redirectToProperty, search.redirectTo, contextRedirectTo],
    );

    const getCallbackURL = useCallback(
        () => `${baseURL}${callbackURLProperty || (persistClient ? `${basePath}/${viewPaths.CALLBACK}?redirectTo=${getRedirectTo()}` : getRedirectTo())}`,
        [callbackURLProperty, persistClient, basePath, viewPaths, baseURL, getRedirectTo],
    );

    const formSchema = z
        .object({
            email: emailSchema,
        })
        .strict();

    const form = useAppForm({
        defaultValues: {
            email: "",
        },
        onSubmit: async ({ value }: { value: { email: string } }) => {
            try {
                const fetchOptions: BetterFetchOption = {
                    headers: await getCaptchaHeaders("/sign-in/magic-link"),
                    throw: true,
                };

                await authClient.signIn.magicLink({
                    callbackURL: getCallbackURL(),
                    email: value.email,
                    fetchOptions,
                });

                toast({
                    message: t`Magic link email sent`,
                    variant: "success",
                });

                form.reset();
            } catch (error) {
                toast({
                    message: getLocalizedError({ error, t }),
                    variant: "error",
                });
            }
        },
        validators: {
            onChange: ({ value }: { value: { email: string } }) => {
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

                <Captcha action="/sign-in/magic-link" ref={captchaRef} />

                <form.Subscribe
                    children={([canSubmit, isFormSubmitting]) => (
                        <Button className={cn("w-full", classNames?.button, classNames?.primaryButton)} disabled={!canSubmit || isSubmitting} type="submit">
                            {isFormSubmitting || isSubmitting ? <Loader2 className="animate-spin" /> : t`Send Magic Link`}
                        </Button>
                    )}
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                />
            </form>
        </form.AppForm>
    );
};
