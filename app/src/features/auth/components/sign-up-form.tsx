"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLingui } from "@lingui/react/macro";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as z from "zod";
import { authClient } from "../lib/client";
import { PasswordInput } from "./password-input";

const baseFormSchema = z.object({
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    email: z.string().email("Invalid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    passwordConfirmation: z.string(),
    image: z.instanceof(File).optional(),
});

const formSchema = baseFormSchema.refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match.",
    path: ["passwordConfirmation"],
});

export function SignUpForm() {
    const { t } = useLingui();

    const navigate = useNavigate();
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const form = useAppForm({
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            passwordConfirmation: "",
            image: undefined,
        },
        validators: {
            onChange: formSchema,
        },
        onSubmit: async ({ value }) => {
            await authClient.signUp.email({
                email: value.email,
                password: value.password,
                name: `${value.firstName} ${value.lastName}`,
                image: value?.image ? await convertImageToBase64(value.image) : "",
                callbackURL: "/chat",
                fetchOptions: {
                    onError: (ctx) => {
                        toast.error(ctx.error.message);
                    },
                    onSuccess: async () => {
                        navigate({ to: "/chat" });
                    },
                },
            });
        },
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            form.setFieldValue("image", file, {
                touch: true,
            });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Card className="z-50 max-w-md rounded-2xl">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">{t`Sign Up`}</CardTitle>
                <CardDescription className="text-xs md:text-sm">{t`Create an account to get started`}</CardDescription>
            </CardHeader>
            <form.AppForm>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void form.handleSubmit();
                    }}
                >
                    <CardContent>
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <form.AppField
                                    name="firstName"
                                    validators={{ onChange: baseFormSchema.shape.firstName }}
                                    children={(field) => (
                                        <field.FormItem>
                                            <field.FormLabel>{t`First Name`}</field.FormLabel>
                                            <field.FormControl>
                                                <Input
                                                    placeholder="Max"
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
                                    name="lastName"
                                    validators={{ onChange: baseFormSchema.shape.lastName }}
                                    children={(field) => (
                                        <field.FormItem>
                                            <field.FormLabel>{t`Last Name`}</field.FormLabel>
                                            <field.FormControl>
                                                <Input
                                                    placeholder="Robinson"
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
                            <form.AppField
                                name="email"
                                validators={{ onChange: baseFormSchema.shape.email }}
                                children={(field) => (
                                    <field.FormItem>
                                        <field.FormLabel>{t`Email`}</field.FormLabel>
                                        <field.FormControl>
                                            <Input
                                                type="email"
                                                placeholder="m@example.com"
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
                                name="password"
                                validators={{ onChange: baseFormSchema.shape.password }}
                                children={(field) => (
                                    <field.FormItem>
                                        <field.FormLabel>{t`Password`}</field.FormLabel>
                                        <field.FormControl>
                                            <PasswordInput
                                                autoComplete="new-password"
                                                placeholder={t`Password`}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
                                            />
                                        </field.FormControl>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            />
                            <form.AppField
                                name="passwordConfirmation"
                                validators={{ onChange: baseFormSchema.shape.passwordConfirmation }}
                                children={(field) => (
                                    <field.FormItem>
                                        <field.FormLabel>{t`Confirm Password`}</field.FormLabel>
                                        <field.FormControl>
                                            <Input
                                                type="password"
                                                autoComplete="new-password"
                                                placeholder={t`Confirm Password`}
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
                                name="image"
                                children={(field) => (
                                    <field.FormItem>
                                        <field.FormLabel>{t`Profile Image`}</field.FormLabel>
                                        <div className="flex items-end gap-4">
                                            <div className="flex w-full items-center gap-2">
                                                <field.FormControl>
                                                    <Input type="file" accept="image/*" onChange={handleImageChange} className="w-full" />
                                                </field.FormControl>
                                                {imagePreview && (
                                                    <X
                                                        className="cursor-pointer"
                                                        onClick={() => {
                                                            form.setFieldValue("image", undefined, { touch: true });
                                                            setImagePreview(null);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            />
                            <form.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                                children={([canSubmit, isSubmitting]) => (
                                    <Button type="submit" className="w-full" disabled={!canSubmit}>
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : t`Create Account`}
                                    </Button>
                                )}
                            />
                        </div>
                    </CardContent>
                </form>
            </form.AppForm>
            <CardFooter>
                <div className="flex w-full justify-center border-t py-4">
                    <p className="text-center text-xs text-neutral-500">
                        {t`Secured by`} <span className="text-orange-400">better-auth.</span>
                    </p>
                </div>
            </CardFooter>
        </Card>
    );
}

async function convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
