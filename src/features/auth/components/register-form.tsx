import { Button } from "@/components/ui/button";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/features/auth/hooks/auth-hooks";
import { useTranslation } from "@/lib/intl/react";
import { useNavigate } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as z from "zod";

const baseFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(5, "Password must be at least 5 characters"),
    confirmPassword: z.string(),
});

const formSchema = baseFormSchema.refine((data) => data.password === data.confirmPassword, {
    message: "The two passwords do not match.",
    path: ["confirmPassword"],
});

export default function RegisterCredentialsForm() {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();
    const registerWithCredentials = useRegister({
        onSuccess: () => {
            navigate({ to: "/" });
        },
        onError: (error) => {
            toast.error(error.error.message ?? JSON.stringify(error.error));
        },
    });

    const form = useAppForm({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
        validators: {
            onBlur: formSchema,
        },
        onSubmit: async ({ value }) => {
            registerWithCredentials.mutate({
                name: value.name,
                email: value.email,
                password: value.password,
            });
        },
    });

    return (
        <form.AppForm>
            <form
                className="flex flex-col gap-y-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <form.AppField
                    name="name"
                    children={(field) => (
                        <field.FormItem>
                            <field.FormLabel>{t("NAME")}</field.FormLabel>
                            <field.FormControl>
                                <Input value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                            </field.FormControl>
                            <field.FormMessage />
                        </field.FormItem>
                    )}
                />
                <form.AppField
                    name="email"
                    children={(field) => (
                        <field.FormItem>
                            <field.FormLabel>{t("EMAIL")}</field.FormLabel>
                            <field.FormControl>
                                <Input type="email" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                            </field.FormControl>
                            <field.FormMessage />
                        </field.FormItem>
                    )}
                />
                <form.AppField
                    name="password"
                    children={(field) => (
                        <field.FormItem>
                            <field.FormLabel>{t("PASSWORD")}</field.FormLabel>
                            <div className="relative flex w-full items-center justify-end">
                                <field.FormControl>
                                    <Input
                                        type={isPasswordVisible ? "text" : "password"}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                </field.FormControl>
                                <Button
                                    className="absolute mr-2 h-7 w-7 rounded-full"
                                    type="button"
                                    tabIndex={-1}
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setIsPasswordVisible(!isPasswordVisible);
                                    }}
                                >
                                    {isPasswordVisible ? <EyeIcon /> : <EyeOffIcon />}
                                </Button>
                            </div>
                            <field.FormMessage />
                        </field.FormItem>
                    )}
                />
                <form.AppField
                    name="confirmPassword"
                    children={(field) => (
                        <field.FormItem>
                            <field.FormLabel>{t("CONFIRM_PASSWORD")}</field.FormLabel>
                            <div className="relative flex w-full items-center justify-end">
                                <field.FormControl>
                                    <Input
                                        type={isConfirmPasswordVisible ? "text" : "password"}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                </field.FormControl>
                                <Button
                                    className="absolute mr-2 h-7 w-7 rounded-full"
                                    type="button"
                                    tabIndex={-1}
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
                                    }}
                                >
                                    {isConfirmPasswordVisible ? <EyeIcon /> : <EyeOffIcon />}
                                </Button>
                            </div>
                            <field.FormMessage />
                        </field.FormItem>
                    )}
                />
                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isSubmitting]) => (
                        <Button type="submit" disabled={!canSubmit} className="mt-3 h-12">
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : t("CREATE_ACCOUNT")}
                        </Button>
                    )}
                />
            </form>
        </form.AppForm>
    );
}
