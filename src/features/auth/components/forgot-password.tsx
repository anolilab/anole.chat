"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthHelpers } from "@/features/auth/hooks/auth-hooks";
import { useTranslation } from "@/lib/intl/react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function ForgotPasswordForm() {
    const { t } = useTranslation();
    const { forgotPassword } = useAuthHelpers();
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            await forgotPassword.mutateAsync({ email });
            setIsSubmitted(true);
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
                <Card className="w-[350px]">
                    <CardHeader>
                        <CardTitle>{t("CHECK_EMAIL")}</CardTitle>
                        <CardDescription>{t("PASSWORD_RESET_LINK_SENT")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>{t("CHECK_SPAM")}</AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> {t("BACK_TO_RESET")}
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        );
    }

    return (
        <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>{t("FORGOT_PASSWORD")}</CardTitle>
                    <CardDescription>{t("FORGOT_PASSWORD_DESC")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="email">{t("EMAIL")}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={t("ENTER_EMAIL")}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
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
                            {isSubmitting ? t("SENDING") : t("SEND_RESET_LINK")}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link to="/login">
                        <Button variant="link" className="px-0">
                            {t("BACK_TO_SIGN_IN")}
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </main>
    );
}
