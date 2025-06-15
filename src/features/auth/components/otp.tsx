"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthHelpers } from "@/features/auth/hooks/auth-hooks";
import { useTranslation } from "@/lib/intl/react";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";
import * as z from "zod";

const formSchema = z.object({
    otp: z.string().length(6, "Code must be 6 digits.").regex(/^\d+$/, "Code must be numeric."),
});

export default function OtpForm() {
    const { t } = useTranslation();
    const { sendOtp, verifyOtp } = useAuthHelpers();
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [isValidated, setIsValidated] = useState(false);
    const router = useRouter();

    const userEmail = "user@example.com";

    const requestOTP = async () => {
        await sendOtp.mutateAsync();
        setMessage(t("OTP_SENT"));
        setIsError(false);
        setIsOtpSent(true);
    };

    const form = useAppForm({
        defaultValues: {
            otp: "",
        },
        validators: {
            onBlur: formSchema,
        },
        onSubmit: async ({ value }) => {
            const res = await verifyOtp.mutateAsync({
                code: value.otp,
            });
            if (res.data) {
                setMessage(t("OTP_VALIDATED"));
                setIsError(false);
                setIsValidated(true);
                router.navigate({ to: "/" });
            } else {
                setIsError(true);
                setMessage(t("INVALID_OTP"));
            }
        },
    });

    return (
        <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>{t("TWO_FACTOR_AUTH")}</CardTitle>
                    <CardDescription>{t("VERIFY_IDENTITY")}</CardDescription>
                </CardHeader>
                <CardContent>
                    {!isOtpSent ? (
                        <Button onClick={requestOTP} className="w-full">
                            <Mail className="mr-2 h-4 w-4" /> {t("SEND_OTP_EMAIL")}
                        </Button>
                    ) : (
                        <form.AppForm>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    form.handleSubmit();
                                }}
                            >
                                <div className="flex flex-col space-y-1.5">
                                    <form.AppField
                                        name="otp"
                                        children={(field) => (
                                            <field.FormItem>
                                                <field.FormLabel>{t("ONE_TIME_PASSWORD")}</field.FormLabel>
                                                <p className="text-muted-foreground py-2 text-sm">
                                                    {t("CHECK_EMAIL_OTP")} {userEmail}
                                                </p>
                                                <field.FormControl>
                                                    <Input
                                                        placeholder={t("ENTER_6_DIGIT")}
                                                        maxLength={6}
                                                        value={field.state.value}
                                                        onBlur={field.handleBlur}
                                                        onChange={(e) => field.handleChange(e.target.value)}
                                                    />
                                                </field.FormControl>
                                                <field.FormMessage />
                                            </field.FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" disabled={form.state.values.otp.length !== 6 || isValidated} className="mt-4 w-full">
                                    {t("VALIDATE_OTP")}
                                </Button>
                            </form>
                        </form.AppForm>
                    )}
                    {message && (
                        <div className={`mt-4 flex items-center gap-2 ${isError ? "text-red-500" : "text-primary"}`}>
                            {isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            <p className="text-sm">{message}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
