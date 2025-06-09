"use client";

import { PasswordInput } from "@/components/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";
import { useTranslation } from "@/lib/intl/react";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ResetPasswordForm() {
    const { t } = useTranslation();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");
        const res = await authClient.resetPassword({
            newPassword: password,
            token: new URLSearchParams(window.location.search).get("token")!,
        });
        if (res.error) {
            toast.error(res.error.message);
        }
        setIsSubmitting(false);
        router.navigate({ to: "/login" });
    }
    return (
        <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>{t("RESET_PASSWORD")}</CardTitle>
                    <CardDescription>{t("RESET_PASSWORD_DESC")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid w-full items-center gap-2">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="email">{t("NEW_PASSWORD")}</Label>
                                <PasswordInput
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="password"
                                    placeholder={t("PASSWORD")}
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="email">{t("CONFIRM_NEW_PASSWORD")}</Label>
                                <PasswordInput
                                    id="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="password"
                                    placeholder={t("PASSWORD")}
                                />
                            </div>
                        </div>
                        {error && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Button className="mt-4 w-full" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? t("RESETTING") : t("RESET_PASSWORD_BUTTON")}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
