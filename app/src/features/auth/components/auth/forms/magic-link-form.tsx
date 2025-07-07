"use client";

import type { BetterFetchOption } from "better-auth/react";
import { Loader2 } from "lucide-react";
import { useCallback, useContext, useEffect } from "react";
import * as z from "zod";

import { useCaptcha } from "../../../hooks/use-captcha";
import { useIsHydrated } from "../../../hooks/use-hydrated";
import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { getLocalizedError, getSearchParam } from "../../../lib/utils";
import type { AuthLocalization } from "../../../localization/auth-localization";
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
    localization: Partial<AuthLocalization>;
    redirectTo?: string;
    setIsSubmitting?: (value: boolean) => void;
}

export function MagicLinkForm({
    className,
    classNames,
    callbackURL: callbackURLProp,
    isSubmitting,
    localization,
    redirectTo: redirectToProp,
    setIsSubmitting,
}: MagicLinkFormProps) {
    const isHydrated = useIsHydrated();
    const { captchaRef, getCaptchaHeaders } = useCaptcha({ localization });

    const {
        authClient,
        basePath,
        baseURL,
        persistClient,
        localization: contextLocalization,
        redirectTo: contextRedirectTo,
        viewPaths,
        toast,
    } = useContext(AuthUIContext);

    localization = { ...contextLocalization, ...localization };

    const getRedirectTo = useCallback(() => redirectToProp || getSearchParam("redirectTo") || contextRedirectTo, [redirectToProp, contextRedirectTo]);

    const getCallbackURL = useCallback(
        () => `${baseURL}${callbackURLProp || (persistClient ? `${basePath}/${viewPaths.CALLBACK}?redirectTo=${getRedirectTo()}` : getRedirectTo())}`,
        [callbackURLProp, persistClient, basePath, viewPaths, baseURL, getRedirectTo],
    );

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
                    message: localization.MAGIC_LINK_EMAIL,
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

                <Captcha ref={captchaRef} localization={localization} action="/sign-in/magic-link" />

                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isFormSubmitting]) => (
                        <Button type="submit" disabled={!canSubmit || isSubmitting} className={cn("w-full", classNames?.button, classNames?.primaryButton)}>
                            {isFormSubmitting || isSubmitting ? <Loader2 className="animate-spin" /> : localization.MAGIC_LINK_ACTION}
                        </Button>
                    )}
                />
            </form>
        </form.AppForm>
    );
}
