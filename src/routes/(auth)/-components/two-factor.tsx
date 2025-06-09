"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";
import { useTranslation } from "@/lib/intl/react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function Component() {
    const { t } = useTranslation();
    const [totpCode, setTotpCode] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (totpCode.length !== 6 || !/^\d+$/.test(totpCode)) {
            setError(t("TOTP_ERROR"));
            return;
        }
        authClient.twoFactor
            .verifyTotp({
                code: totpCode,
            })
            .then((res) => {
                if (res.data?.token) {
                    setSuccess(true);
                    setError("");
                } else {
                    setError(t("INVALID_OTP"));
                }
            });
    };

    return (
        <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>{t("TOTP_VERIFICATION")}</CardTitle>
                    <CardDescription>{t("ENTER_TOTP")}</CardDescription>
                </CardHeader>
                <CardContent>
                    {!success ? (
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <Label htmlFor="totp">{t("TOTP_CODE")}</Label>
                                <Input
                                    id="totp"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="\d{6}"
                                    maxLength={6}
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value)}
                                    placeholder={t("ENTER_6_DIGIT_CODE")}
                                    required
                                />
                            </div>
                            {error && (
                                <div className="mt-2 flex items-center text-red-500">
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}
                            <Button type="submit" className="mt-4 w-full">
                                {t("VERIFY")}
                            </Button>
                        </form>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-2">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                            <p className="text-lg font-semibold">{t("VERIFICATION_SUCCESSFUL")}</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="text-muted-foreground gap-2 text-sm">
                    <Link to="/two-factor/otp">
                        <Button variant="link" size="sm">
                            {t("SWITCH_EMAIL_VERIFICATION")}
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </main>
    );
}
