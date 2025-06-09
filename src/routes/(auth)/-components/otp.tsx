"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthHelpers } from "@/hooks/auth-hooks";
import { authClient } from "@/lib/auth/client";
import { useTranslation } from "@/lib/intl/react";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";

export default function Component() {
    const { t } = useTranslation();
    const { sendOtp, verifyOtp } = useAuthHelpers();
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [isValidated, setIsValidated] = useState(false);

    // In a real app, this email would come from your authentication context
    const userEmail = "user@example.com";

    const requestOTP = async () => {
        await sendOtp.mutateAsync();
        // In a real app, this would call your backend API to send the OTP
        setMessage(t("OTP_SENT"));
        setIsError(false);
        setIsOtpSent(true);
    };
    const router = useRouter();

    const validateOTP = async () => {
        const res = await verifyOtp.mutateAsync({
            code: otp,
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
    };
    return (
        <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>{t("TWO_FACTOR_AUTH")}</CardTitle>
                    <CardDescription>{t("VERIFY_IDENTITY")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full items-center gap-4">
                        {!isOtpSent ? (
                            <Button onClick={requestOTP} className="w-full">
                                <Mail className="mr-2 h-4 w-4" /> {t("SEND_OTP_EMAIL")}
                            </Button>
                        ) : (
                            <>
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="otp">{t("ONE_TIME_PASSWORD")}</Label>
                                    <Label className="py-2">
                                        {t("CHECK_EMAIL_OTP")} {userEmail}
                                    </Label>
                                    <Input id="otp" placeholder={t("ENTER_6_DIGIT")} value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
                                </div>
                                <Button onClick={validateOTP} disabled={otp.length !== 6 || isValidated}>
                                    {t("VALIDATE_OTP")}
                                </Button>
                            </>
                        )}
                    </div>
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
