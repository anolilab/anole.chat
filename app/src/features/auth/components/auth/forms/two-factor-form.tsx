"use client";

import type { BetterFetchError } from "better-auth/react";
import type { Checkbox as CheckboxPrimitive } from "radix-ui";
import { Loader2, QrCodeIcon, SendIcon } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import * as z from "zod";
import { t } from "@lingui/core/macro";

import { useIsHydrated } from "../../../hooks/use-hydrated";
import { useOnSuccessTransition } from "../../../hooks/use-success-transition";
import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { getLocalizedError, getSearchParam } from "../../../lib/utils";
import type { User } from "../../../types/auth-core-types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppForm } from "@/components/ui/form";
import { InputOTP } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import type { AuthFormClassNames } from "../auth-form";
import { OTPInputGroup } from "../otp-input-group";

export interface TwoFactorFormProps {
    className?: string;
    classNames?: AuthFormClassNames;
    isSubmitting?: boolean;
    otpSeparators?: 0 | 1 | 2;
    redirectTo?: string;
    setIsSubmitting?: (value: boolean) => void;
}

const formSchema = z.object({
    code: z
        .string()
        .min(1, {
            message: "One-time password is required",
        })
        .min(6, {
            message: "One-time password is invalid",
        }),
    trustDevice: z.boolean().optional(),
});

export function TwoFactorForm({ className, classNames, isSubmitting, otpSeparators = 0, redirectTo, setIsSubmitting }: TwoFactorFormProps) {
    const isHydrated = useIsHydrated();
    const totpURI = isHydrated ? getSearchParam("totpURI") : null;
    const initialSendRef = useRef(false);

    const {
        authClient,
        basePath,
        hooks: { useSession },
        twoFactor,
        viewPaths,
        toast,
        Link,
    } = useContext(AuthUIContext);

    const { onSuccess, isPending: transitionPending } = useOnSuccessTransition({
        redirectTo,
    });

    const { data: sessionData } = useSession();
    const isTwoFactorEnabled = (sessionData?.user as User)?.twoFactorEnabled;

    const [method, setMethod] = useState<"totp" | "otp" | null>(twoFactor?.length === 1 ? twoFactor[0] : null);

    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);

    const form = useAppForm({
        defaultValues: {
            code: "",
            trustDevice: false,
        },
        validators: {
            onChange: ({ value }) => {
                const result = formSchema.safeParse(value);
                if (!result.success) {
                    return result.error.issues[0]?.message;
                }
                return undefined;
            },
        },
        onSubmit: async ({ value }) => {
            try {
                const verifyMethod = method === "totp" ? authClient.twoFactor.verifyTotp : authClient.twoFactor.verifyOtp;

                await verifyMethod({
                    code: value.code,
                    trustDevice: value.trustDevice,
                    fetchOptions: { throw: true },
                });

                await onSuccess();

                if (sessionData && !isTwoFactorEnabled) {
                    toast({
                        variant: "success",
                        message: t`Two-factor authentication enabled`,
                    });
                }
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error }),
                });

                form.reset();
            }
        },
    });

    isSubmitting = isSubmitting || form.state.isSubmitting || transitionPending;

    useEffect(() => {
        setIsSubmitting?.(form.state.isSubmitting || transitionPending);
    }, [form.state.isSubmitting, transitionPending, setIsSubmitting]);

    // biome-ignore lint/correctness/useExhaustiveDependencies:
    useEffect(() => {
        if (method === "otp" && cooldownSeconds <= 0 && !initialSendRef.current) {
            initialSendRef.current = true;
            sendOtp();
        }
    }, [method]);

    useEffect(() => {
        if (cooldownSeconds <= 0) return;

        const timer = setTimeout(() => {
            setCooldownSeconds((prev) => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [cooldownSeconds]);

    const sendOtp = async () => {
        if (isSendingOtp || cooldownSeconds > 0) return;

        try {
            setIsSendingOtp(true);
            await authClient.twoFactor.sendOtp({
                fetchOptions: { throw: true },
            });
            setCooldownSeconds(60);
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error }),
            });

            if ((error as BetterFetchError).error.code === "INVALID_TWO_FACTOR_COOKIE") {
                history.back();
            }
        }

        initialSendRef.current = false;
        setIsSendingOtp(false);
    };

    return (
        <form.AppForm>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
                className={cn("grid w-full gap-6", className, classNames?.base)}
            >
                {twoFactor?.includes("totp") && totpURI != null && (method ?? null) === "totp" && (
                    <div className="space-y-3">
                        <Label className={classNames?.label}>{t`Two-factor authentication (TOTP)`}</Label>
                        <QRCode className={cn("shadow-xs border", classNames?.qrCode)} value={totpURI ?? ""} />
                    </div>
                )}

                {method !== null && (
                    <>
                        <form.AppField
                            name="code"
                            children={(field) => (
                                <field.FormItem>
                                    <div className="flex items-center justify-between">
                                        <field.FormLabel className={classNames?.label}>{t`One-time password`}</field.FormLabel>

                                        <Link
                                            className={cn("text-sm hover:underline", classNames?.forgotPasswordLink)}
                                            href={`${basePath}/${viewPaths.RECOVER_ACCOUNT}${isHydrated ? window.location.search : ""}`}
                                        >
                                            {t`Forgot authenticator`}
                                        </Link>
                                    </div>

                                    <field.FormControl>
                                        <InputOTP
                                            maxLength={6}
                                            value={field.state.value}
                                            onChange={(value) => {
                                                field.handleChange(value);

                                                if (value.length === 6) {
                                                    form.handleSubmit();
                                                }
                                            }}
                                            containerClassName={classNames?.otpInputContainer}
                                            className={classNames?.otpInput}
                                            disabled={isSubmitting}
                                        >
                                            <OTPInputGroup otpSeparators={otpSeparators} />
                                        </InputOTP>
                                    </field.FormControl>

                                    <field.FormMessage className={classNames?.error} />
                                </field.FormItem>
                            )}
                        />

                        <form.AppField
                            name="trustDevice"
                            children={(field) => (
                                <field.FormItem className="flex">
                                    <field.FormControl>
                                        <Checkbox
                                            checked={field.state.value}
                                            onCheckedChange={(checked: CheckboxPrimitive.CheckedState) => {
                                                field.handleChange(checked === true);
                                            }}
                                            disabled={isSubmitting}
                                            className={classNames?.checkbox}
                                        />
                                    </field.FormControl>

                                    <field.FormLabel className={classNames?.label}>{t`Trust this device`}</field.FormLabel>
                                </field.FormItem>
                            )}
                        />
                    </>
                )}

                <div className="grid gap-4">
                    {method !== null && (
                        <form.Subscribe
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                            children={([canSubmit, isSubmitting]) => (
                                <Button type="submit" disabled={!canSubmit || isSubmitting} className={cn(classNames?.button, classNames?.primaryButton)}>
                                    {isSubmitting && <Loader2 className="animate-spin" />}
                                    {t`Two-factor authentication`}
                                </Button>
                            )}
                        />
                    )}

                    {method === "otp" && twoFactor?.includes("otp") && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={sendOtp}
                            disabled={cooldownSeconds > 0 || isSendingOtp || isSubmitting}
                            className={cn(classNames?.button, classNames?.outlineButton)}
                        >
                            {isSendingOtp ? <Loader2 className="animate-spin" /> : <SendIcon className={classNames?.icon} />}

                            {t`Resend code`}
                            {cooldownSeconds > 0 && ` (${cooldownSeconds})`}
                        </Button>
                    )}

                    {method !== "otp" && twoFactor?.includes("otp") && (
                        <Button
                            type="button"
                            variant="secondary"
                            className={cn(classNames?.button, classNames?.secondaryButton)}
                            onClick={() => setMethod("otp")}
                            disabled={isSubmitting}
                        >
                            <SendIcon className={classNames?.icon} />
                            {t`Send verification code`}
                        </Button>
                    )}

                    {method !== "totp" && twoFactor?.includes("totp") && (
                        <Button
                            type="button"
                            variant="secondary"
                            className={cn(classNames?.button, classNames?.secondaryButton)}
                            onClick={() => setMethod("totp")}
                            disabled={isSubmitting}
                        >
                            <QrCodeIcon className={classNames?.icon} />
                            {t`Continue with authenticator`}
                        </Button>
                    )}
                </div>
            </form>
        </form.AppForm>
    );
}
