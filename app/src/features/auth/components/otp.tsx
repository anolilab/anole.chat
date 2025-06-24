"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthHelpers } from "@/features/auth/hooks/auth-hooks";
import { useLingui } from "@lingui/react/macro";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import * as z from "zod";

const formSchema = z.object({
    otp: z.string().length(6, "Code must be 6 digits.").regex(/^\d+$/, "Code must be numeric."),
});

export default function OtpForm() {
    const { t } = useLingui();

    const { sendOtp, verifyOtp } = useAuthHelpers();
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const router = useRouter();

    const userEmail = "user@example.com";

    const requestOTP = async () => {
        await sendOtp.mutateAsync();
        setMessage(t`OTP sent to your email`);
        setIsError(false);
        setIsOtpSent(true);
    };

    const form = useAppForm({
        defaultValues: {
            otp: "",
        },
        validators: {
            onChange: formSchema,
        },
        onSubmit: async ({ value }) => {
            const res = await verifyOtp.mutateAsync({
                code: value.otp,
            });

            if (res.data) {
                setMessage(t`OTP validated successfully`);
                setIsError(false);
                router.navigate({ to: "/" });
            } else {
                setIsError(true);
                setMessage(t`Invalid OTP`);
            }
        },
    });

    return (
        <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>{t`Two-Factor Authentication`}</CardTitle>
                    <CardDescription>{t`Verify your identity with a one-time password`}</CardDescription>
                </CardHeader>
                <CardContent>
                    {!isOtpSent ? (
                        <Button onClick={requestOTP} className="w-full">
                            <Mail className="mr-2 h-4 w-4" /> {t`Send OTP to Email`}
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
                                                <field.FormLabel>{t`One-Time Password`}</field.FormLabel>
                                                <p className="text-muted-foreground py-2 text-sm">
                                                    {t`Check your email for the OTP sent to`} {userEmail}
                                                </p>
                                                <field.FormControl>
                                                    <Input
                                                        placeholder={t`Enter 6-digit code`}
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

                                <form.Subscribe
                                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                                    children={([canSubmit, isSubmitting]) => (
                                        <Button type="submit" className="w-full" disabled={form.state.values.otp.length !== 6 || !canSubmit}>
                                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : t`Validate OTP`}
                                        </Button>
                                    )}
                                />
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
