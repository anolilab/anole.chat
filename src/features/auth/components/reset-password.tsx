"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { PasswordInput } from "@/features/auth/components/password-input";
import { useLingui } from "@lingui/react/macro";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "../lib/client";

const baseFormSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
});

const formSchema = baseFormSchema.refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});

export default function ResetPasswordForm() {
    const { t } = useLingui();

    const [error, setError] = useState("");
    const router = useRouter();

    const form = useAppForm({
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
        validators: {
            onBlur: formSchema,
        },
        onSubmit: async ({ value }) => {
            setError("");
            const res = await authClient.resetPassword({
                newPassword: value.password,
                token: new URLSearchParams(window.location.search).get("token")!,
            });
            if (res.error) {
                toast.error(res.error.message);
            }

            router.navigate({ to: "/login" });
        },
    });

    return (
        <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>{t`Reset Password`}</CardTitle>
                    <CardDescription>{t`Enter your new password below`}</CardDescription>
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
                            <div className="grid w-full items-center gap-2">
                                <form.AppField
                                    name="password"
                                    children={(field) => (
                                        <field.FormItem>
                                            <field.FormLabel>{t`New Password`}</field.FormLabel>
                                            <field.FormControl>
                                                <PasswordInput
                                                    autoComplete="new-password"
                                                    placeholder={t`Password`}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                />
                                            </field.FormControl>
                                            <field.FormMessage />
                                        </field.FormItem>
                                    )}
                                />
                                <form.AppField
                                    name="confirmPassword"
                                    children={(field) => (
                                        <field.FormItem>
                                            <field.FormLabel>{t`Confirm New Password`}</field.FormLabel>
                                            <field.FormControl>
                                                <PasswordInput
                                                    autoComplete="new-password"
                                                    placeholder={t`Password`}
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
                                        {isSubmitting ? t`Resetting...` : t`Reset Password`}
                                    </Button>
                                )}
                            />
                        </form>
                    </form.AppForm>
                </CardContent>
            </Card>
        </div>
    );
}
