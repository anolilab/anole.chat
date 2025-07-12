"use client";

import { t } from "@lingui/core/macro";
import { Link, useSearch } from "@tanstack/react-router";
import type { BetterFetchError } from "better-auth/react";
import { Loader2, QrCodeIcon, SendIcon } from "lucide-react";
import type { Checkbox as CheckboxPrimitive } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { z } from "zod/v4";

import CopyButton from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppForm } from "@/components/ui/form";
import { InputOTP } from "@/components/ui/input-otp";
import type { AuthFormClassNames } from "@/features/auth/components/auth/auth-form";
import { OTPInputGroup } from "@/features/auth/components/auth/otp-input-group";
import { useOnSuccessTransition } from "@/features/auth/hooks/use-success-transition";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { getLocalizedError } from "@/features/auth/lib/utils";
import type { User } from "@/features/auth/types/auth-core-types";
import { useIsHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

export interface TwoFactorFormProperties {
    className?: string;
    classNames?: AuthFormClassNames;
    isSubmitting?: boolean;
    otpSeparators?: 0 | 1 | 2;
    redirectTo?: string;
    setIsSubmitting?: (value: boolean) => void;
}

const formSchema = z
    .object({
        code: z
            .string()
            .min(1, {
                message: "One-time password is required",
            })
            .min(6, {
                message: "One-time password is invalid",
            }),
        trustDevice: z.boolean().optional(),
    })
    .strict();

// Helper function to extract secret from TOTP URI
const extractSecretFromTotpUri = (totpURI: string): string | null => {
    try {
        const url = new URL(totpURI);

        return url.searchParams.get("secret");
    } catch {
        return null;
    }
};

export const TwoFactorForm = ({ className, classNames, isSubmitting, otpSeparators = 0, redirectTo, setIsSubmitting }: TwoFactorFormProperties) => {
    const isHydrated = useIsHydrated();
    const search = useSearch({ strict: false }) as any;

    const totpURI = isHydrated ? search?.totpURI : null;
    const digits = isHydrated ? search?.digits : null;
    const hideForgotAuthenticator = !!search?.hideForgotAuthenticator;
    const totpSecret = totpURI ? extractSecretFromTotpUri(totpURI) : null;

    const initialSendReference = useRef(false);

    const {
        authClient,
        basePath,
        hooks: { useSession },
        toast,
        twoFactor,
        viewPaths,
    } = useAuth();

    const { isPending: transitionPending, onSuccess } = useOnSuccessTransition({
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
        onSubmit: async ({ value }) => {
            try {
                const verifyMethod = method === "totp" ? authClient.twoFactor.verifyTotp : authClient.twoFactor.verifyOtp;

                await verifyMethod({
                    code: value.code,
                    fetchOptions: { throw: true },
                    trustDevice: value.trustDevice,
                });

                await onSuccess();

                if (sessionData && !isTwoFactorEnabled) {
                    toast({
                        message: t`Two-factor authentication enabled`,
                        variant: "success",
                    });
                }
            } catch (error) {
                toast({
                    message: getLocalizedError({ error }),
                    variant: "error",
                });

                form.reset();
            }
        },
        validators: {
            onChange: formSchema,
        },
    });

    isSubmitting = isSubmitting || form.state.isSubmitting || transitionPending;

    useEffect(() => {
        setIsSubmitting?.(form.state.isSubmitting || transitionPending);
    }, [form.state.isSubmitting, transitionPending, setIsSubmitting]);

    useEffect(() => {
        if (method === "otp" && cooldownSeconds <= 0 && !initialSendReference.current) {
            initialSendReference.current = true;
            sendOtp();
        }
    }, [method]);

    useEffect(() => {
        if (cooldownSeconds <= 0)
            return;

        const timer = setTimeout(() => {
            setCooldownSeconds((previous) => previous - 1);
        }, 1000);

        return () => {
            clearTimeout(timer);
        };
    }, [cooldownSeconds]);

    const sendOtp = async () => {
        if (isSendingOtp || cooldownSeconds > 0)
            return;

        try {
            setIsSendingOtp(true);
            await authClient.twoFactor.sendOtp({
                fetchOptions: { throw: true },
            });
            setCooldownSeconds(60);
        } catch (error) {
            toast({
                message: getLocalizedError({ error }),
                variant: "error",
            });

            if ((error as BetterFetchError).error.code === "INVALID_TWO_FACTOR_COOKIE") {
                history.back();
            }
        }

        initialSendReference.current = false;
        setIsSendingOtp(false);
    };

    return (
        <form.AppForm>
            <form
                className={cn("grid w-full gap-6", className, classNames?.base)}
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                {twoFactor?.includes("totp") && totpURI && method === "totp" && (
                    <div className="space-y-4">
                        <div className={classNames?.label}>
                            {t`Using an authenticator app like`}
                            {" "}
                            <a
                                className="text-blue-500 hover:underline"
                                href="https://www.google.com/search?q=google+authenticator"
                                rel="noreferrer"
                                target="_blank"
                            >
                                Google Authenticator
                            </a>
                            ,
                            {" "}
                            <a
                                className="text-blue-500 hover:underline"
                                href="https://www.google.com/search?q=google+authenticator"
                                rel="noreferrer"
                                target="_blank"
                            >
                                Microsoft Authenticator
                            </a>
                            {" "}
                            {t`or`}
                            {" "}
                            <a
                                className="text-blue-500 hover:underline"
                                href="https://www.google.com/search?q=google+authenticator"
                                rel="noreferrer"
                                target="_blank"
                            >
                                Authy
                            </a>
                            ,
                            {" "}
                            {t`scan this QR code. it will generate a 6 digit code for you to enter below.`}
                        </div>
                        <QRCode className={cn("shadow-xs mx-auto border", classNames?.qrCode)} value={totpURI} />

                        {totpSecret && (
                            <div className="max-w-sm space-y-2">
                                <p className="text-muted-foreground text-center text-sm">
                                    {t`Scan not working? Copy this code key and enter it manually in your authentication app.`}
                                </p>
                                <div className="bg-muted/50 flex items-center justify-center gap-2 rounded-md border p-3">
                                    <code className="break-all font-mono text-sm">{totpSecret}</code>
                                    <CopyButton textToCopy={totpSecret} />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {method !== null && (
                    <>
                        <form.AppField
                            children={(field) => (
                                <field.FormItem>
                                    <div className="flex items-center justify-between">
                                        <field.FormLabel className={classNames?.label}>{t`One-time password`}</field.FormLabel>

                                        {!hideForgotAuthenticator && (
                                            <Link
                                                className={cn("text-sm hover:underline", classNames?.forgotPasswordLink)}
                                                to={`${basePath}/${viewPaths.RECOVER_ACCOUNT}${isHydrated ? globalThis.location.search : ""}`}
                                            >
                                                {t`Forgot authenticator`}
                                            </Link>
                                        )}
                                    </div>

                                    <field.FormControl>
                                        <InputOTP
                                            className={classNames?.otpInput}
                                            containerClassName={classNames?.otpInputContainer}
                                            disabled={isSubmitting}
                                            maxLength={digits}
                                            onChange={(value) => {
                                                field.handleChange(value);

                                                if (value.length === digits) {
                                                    form.handleSubmit();
                                                }
                                            }}
                                            value={field.state.value}
                                        >
                                            <OTPInputGroup otpSeparators={otpSeparators} />
                                        </InputOTP>
                                    </field.FormControl>

                                    <field.FormMessage className={classNames?.error} />
                                </field.FormItem>
                            )}
                            name="code"
                        />

                        <form.AppField
                            children={(field) => (
                                <field.FormItem className="flex">
                                    <field.FormControl>
                                        <Checkbox
                                            checked={field.state.value}
                                            className={classNames?.checkbox}
                                            disabled={isSubmitting}
                                            onCheckedChange={(checked: CheckboxPrimitive.CheckedState) => {
                                                field.handleChange(checked === true);
                                            }}
                                        />
                                    </field.FormControl>

                                    <field.FormLabel className={classNames?.label}>{t`Trust this device`}</field.FormLabel>
                                </field.FormItem>
                            )}
                            name="trustDevice"
                        />
                    </>
                )}

                <div className="grid gap-4">
                    {method !== null && (
                        <form.Subscribe
                            children={([canSubmit, isSubmitting]) => (
                                <Button className={cn(classNames?.button, classNames?.primaryButton)} disabled={!canSubmit || isSubmitting} type="submit">
                                    {isSubmitting && <Loader2 className="animate-spin" />}
                                    {t`Two-factor authentication`}
                                </Button>
                            )}
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                        />
                    )}

                    {method === "otp" && twoFactor?.includes("otp") && (
                        <Button
                            className={cn(classNames?.button, classNames?.outlineButton)}
                            disabled={cooldownSeconds > 0 || isSendingOtp || isSubmitting}
                            onClick={sendOtp}
                            type="button"
                            variant="outline"
                        >
                            {isSendingOtp ? <Loader2 className="animate-spin" /> : <SendIcon className={classNames?.icon} />}

                            {t`Resend code`}
                            {cooldownSeconds > 0 && ` (${cooldownSeconds})`}
                        </Button>
                    )}

                    {method !== "otp" && twoFactor?.includes("otp") && (
                        <Button
                            className={cn(classNames?.button, classNames?.secondaryButton)}
                            disabled={isSubmitting}
                            onClick={() => {
                                setMethod("otp");
                            }}
                            type="button"
                            variant="secondary"
                        >
                            <SendIcon className={classNames?.icon} />
                            {t`Send verification code`}
                        </Button>
                    )}

                    {method !== "totp" && twoFactor?.includes("totp") && (
                        <Button
                            className={cn(classNames?.button, classNames?.secondaryButton)}
                            disabled={isSubmitting}
                            onClick={() => {
                                setMethod("totp");
                            }}
                            type="button"
                            variant="secondary"
                        >
                            <QrCodeIcon className={classNames?.icon} />
                            {t`Continue with authenticator`}
                        </Button>
                    )}
                </div>
            </form>
        </form.AppForm>
    );
};
