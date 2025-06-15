"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthHelpers } from "@/features/auth/hooks/auth-hooks";
import { useTranslation } from "@/lib/intl/react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import * as z from "zod";

const formSchema = z.object({
    email: z.string().email("Invalid email address."),
});

export default function ForgotPasswordForm() {
    const { t } = useTranslation();
    const { forgotPassword } = useAuthHelpers();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState("");

    const form = useAppForm({
        defaultValues: {
            email: "",
        },
        validators: {
            onBlur: formSchema,
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            setError("");
            try {
                await forgotPassword.mutateAsync(value);
                setIsSubmitted(true);
            } catch (err) {
                setError("An error occurred. Please try again.");
            } finally {
                setIsSubmitting(false);
            }
        },
    });

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
                    <form.AppForm>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                form.handleSubmit();
                            }}
                        >
                            <div className="grid w-full items-center gap-4">
                                <form.AppField
                                    name="email"
                                    children={(field) => (
                                        <field.FormItem>
                                            <field.FormLabel>{t("EMAIL")}</field.FormLabel>
                                            <field.FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder={t("ENTER_EMAIL")}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    required
                                                />
                                            </field.FormControl>
                                            <field.FormMessage />
                                        </field.FormItem>
                                    )}
                                />
                            </div>
                            {error && (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <form.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                                children={([canSubmit, isSubmitting]) => (
                                    <Button type="submit" className="w-full" disabled={!canSubmit}>
                                        {isSubmitting ? t("SENDING") : t("SEND_RESET_LINK")}
                                    </Button>
                                )}
                            />
                        </form>
                    </form.AppForm>
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
