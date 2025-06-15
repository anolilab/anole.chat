import FormFieldInfo from "@/components/form-field-info";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/features/auth/hooks/auth-hooks";
import { useTranslation } from "@/lib/intl/react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as z from "zod";

const FormSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Please enter a valid email address"),
        password: z.string().min(5, "Password must be at least 5 characters"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "The two passwords do not match.",
        path: ["confirmPassword"], // Shows error on confirmPassword field
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
    const form = useForm({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
        validators: {
            onChange: FormSchema,
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
        <form
            className="flex flex-col gap-y-3"
            onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
            }}
        >
            <div>
                <form.Field
                    name="name"
                    children={(field) => (
                        <>
                            <Label htmlFor={field.name}>{t("NAME")}</Label>
                            <Input
                                className="mt-1"
                                id={field.name}
                                type="text"
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                            <FormFieldInfo field={field} />
                        </>
                    )}
                />
            </div>
            <div>
                <form.Field
                    name="email"
                    children={(field) => (
                        <>
                            <Label htmlFor={field.name}>{t("EMAIL")}</Label>
                            <Input
                                className="mt-1"
                                id={field.name}
                                type="email"
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                            <FormFieldInfo field={field} />
                        </>
                    )}
                />
            </div>
            <div>
                <form.Field
                    name="password"
                    children={(field) => (
                        <>
                            <Label htmlFor={field.name}>{t("PASSWORD")}</Label>
                            <div className="relative flex w-full items-center justify-end">
                                <Input
                                    className="mt-1"
                                    id={field.name}
                                    type={isPasswordVisible ? "text" : "password"}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
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
                            <FormFieldInfo field={field} />
                        </>
                    )}
                />
            </div>
            <div>
                <form.Field
                    name="confirmPassword"
                    children={(field) => (
                        <>
                            <Label htmlFor={field.name}>{t("CONFIRM_PASSWORD")}</Label>
                            <div className="relative flex w-full items-center justify-end">
                                <Input
                                    className="mt-1"
                                    id={field.name}
                                    type={isConfirmPasswordVisible ? "text" : "password"}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
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
                            <FormFieldInfo field={field} />
                        </>
                    )}
                />
            </div>
            <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                    <Button type="submit" disabled={!canSubmit} className="mt-3 h-12">
                        {isSubmitting ? "..." : t("REGISTER")}
                    </Button>
                )}
            />
        </form>
    );
}
