"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/intl/react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import * as z from "zod";
import { authClient } from "../lib/client";

const formSchema = z.object({
    totpCode: z.string().length(6, "Code must be 6 digits.").regex(/^\d+$/, "Code must be numeric."),
});

export default function TwoFactorForm() {
    const { t } = useTranslation();
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const form = useAppForm({
        defaultValues: {
            totpCode: "",
        },
        validators: {
            onChange: formSchema,
        },
        onSubmit: ({ value }) => {
            authClient.twoFactor
                .verifyTotp({
                    code: value.totpCode,
                })
                .then((res) => {
                    if (res.data?.token) {
                        setSuccess(true);
                        setError("");
                    } else {
                        setError(t("INVALID_OTP"));
                    }
                });
        },
    });

    return (
        <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>{t("TOTP_VERIFICATION")}</CardTitle>
                    <CardDescription>{t("ENTER_TOTP")}</CardDescription>
                </CardHeader>
                <CardContent>
                    {!success ? (
                        <form.AppForm>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    form.handleSubmit();
                                }}
                            >
                                <form.AppField
                                    name="totpCode"
                                    children={(field) => (
                                        <field.FormItem>
                                            <field.FormLabel>{t("TOTP_CODE")}</field.FormLabel>
                                            <field.FormControl>
                                                <Input
                                                    inputMode="numeric"
                                                    pattern="\\d{6}"
                                                    maxLength={6}
                                                    placeholder={t("ENTER_6_DIGIT_CODE")}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                />
                                            </field.FormControl>
                                            <field.FormMessage />
                                        </field.FormItem>
                                    )}
                                />
                                {error && (
                                    <div className="mt-2 flex items-center text-red-500">
                                        <AlertCircle className="mr-2 h-4 w-4" />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}
                                <form.Subscribe
                                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                                    children={([canSubmit, isSubmitting]) => (
                                        <Button type="submit" className="mt-4 w-full" disabled={!canSubmit}>
                                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : t("VERIFY")}
                                        </Button>
                                    )}
                                />
                            </form>
                        </form.AppForm>
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
