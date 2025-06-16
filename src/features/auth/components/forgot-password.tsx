"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthHelpers } from "@/features/auth/hooks/auth-hooks";
import { useLingui } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import * as z from "zod";

const formSchema = z.object({
    email: z.string().email("Invalid email address."),
});

export default function ForgotPasswordForm() {
    const { t } = useLingui();
    const { forgotPassword } = useAuthHelpers();
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
            setError("");
            try {
                await forgotPassword.mutateAsync(value);
            } catch (err) {
                setError("An error occurred. Please try again.");
            }
        },
    });

    if (isSubmitted) {
        return (
            <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
                <Card className="w-[350px]">
                    <CardHeader>
                        <CardTitle>{t`Check Email`}</CardTitle>
                        <CardDescription>{t`Password reset link sent`}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>{t`Check your spam folder if you don't see the email`}</AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> {t`Back to Reset`}
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
                    <CardTitle>{t`Forgot Password`}</CardTitle>
                    <CardDescription>{t`Enter your email to receive a password reset link`}</CardDescription>
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
                                            <field.FormLabel>{t`Email`}</field.FormLabel>
                                            <field.FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder={t`Enter your email`}
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
                                        {isSubmitting ? t`Sending...` : t`Send Reset Link`}
                                    </Button>
                                )}
                            />
                        </form>
                    </form.AppForm>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link to="/login">
                        <Button variant="link" className="px-0">
                            {t`Back to Sign In`}
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </main>
    );
}
