"use client";

import type { BetterFetchOption } from "better-auth/react";
import { Loader2 } from "lucide-react";
import { useCallback, useContext, useEffect } from "react";
import { z } from "zod/v4";
import { t } from "@lingui/core/macro";

import { useCaptcha } from "../../../hooks/use-captcha";
import { useIsHydrated } from "../../../hooks/use-hydrated";
import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { getLocalizedError, getSearchParam } from "../../../lib/utils";
import { Captcha } from "../../captcha/captcha";
import { Button } from "@/components/ui/button";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { AuthFormClassNames } from "../auth-form";

export interface MagicLinkFormProps {
    className?: string;
    classNames?: AuthFormClassNames;
    callbackURL?: string;
    isSubmitting?: boolean;
    redirectTo?: string;
    setIsSubmitting?: (value: boolean) => void;
}

export function MagicLinkForm({
    className,
    classNames,
    callbackURL: callbackURLProp,
    isSubmitting,
    redirectTo: redirectToProp,
    setIsSubmitting,
}: MagicLinkFormProps) {
    const isHydrated = useIsHydrated();
    const { captchaRef, getCaptchaHeaders } = useCaptcha();

    const { authClient, basePath, baseURL, persistClient, viewPaths, toast } = useContext(AuthUIContext);

    const getRedirectTo = useCallback(() => redirectToProp || getSearchParam("redirectTo") || contextRedirectTo, [redirectToProp, contextRedirectTo]);

    const getCallbackURL = useCallback(
        () => `${baseURL}${callbackURLProp || (persistClient ? `${basePath}/${viewPaths.CALLBACK}?redirectTo=${getRedirectTo()}` : getRedirectTo())}`,
        [callbackURLProp, persistClient, basePath, viewPaths, baseURL, getRedirectTo],
    );

    const formSchema = z.object({
        email: z
            .string()
            .min(1, {
                message: t`Email is required`,
            })
            .email({
                message: t`Email is invalid`,
            }),
    });

    const form = useAppForm({
        defaultValues: {
            email: "",
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
        onSubmit: async ({ value }: { value: { email: string } }) => {
            try {
                const fetchOptions: BetterFetchOption = {
                    throw: true,
                    headers: await getCaptchaHeaders("/sign-in/magic-link"),
                };

                await authClient.signIn.magicLink({
                    email: value.email,
                    callbackURL: getCallbackURL(),
                    fetchOptions,
                });

                toast({
                    variant: "success",
                    message: t`Magic link email sent`,
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
                            <field.FormLabel className={classNames?.label}>{t`Email`}</field.FormLabel>

                            <field.FormControl>
                                <Input
                                    className={classNames?.input}
                                    type="email"
                                    autoComplete="email"
                                    placeholder={t`Enter your email`}
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

                <Captcha ref={captchaRef} action="/sign-in/magic-link" />

                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isFormSubmitting]) => (
                        <Button type="submit" disabled={!canSubmit || isSubmitting} className={cn("w-full", classNames?.button, classNames?.primaryButton)}>
                            {isFormSubmitting || isSubmitting ? <Loader2 className="animate-spin" /> : t`Send Magic Link`}
                        </Button>
                    )}
                />
            </form>
        </form.AppForm>
    );
}
