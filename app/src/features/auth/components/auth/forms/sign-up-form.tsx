"use client";

import { t } from "@lingui/core/macro";
import { Link, useSearch } from "@tanstack/react-router";
import type { BetterFetchOption } from "better-auth/react";
import { Loader2, Trash2Icon, UploadCloudIcon } from "lucide-react";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod/v4";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import { useIsHydrated } from "../../../../../hooks/use-hydrated";
import { useCaptcha } from "../../../hooks/use-captcha";
import { useOnSuccessTransition } from "../../../hooks/use-success-transition";
import { fileToBase64, resizeAndCropImage } from "../../../lib/image-utils";
import { getLocalizedError } from "../../../lib/utils";
import type { PasswordValidation } from "../../../types/form-validation-types";
import { Captcha } from "../../captcha/captcha";
import { PasswordInput } from "../../password-input";
import type { AuthFormClassNames } from "../auth-form";

export interface SignUpFormProperties {
    callbackURL?: string;
    className?: string;
    classNames?: AuthFormClassNames;
    isSubmitting?: boolean;
    passwordValidation?: PasswordValidation;
    redirectTo?: string;
    setIsSubmitting?: (value: boolean) => void;
}

export const SignUpForm = ({ callbackURL, className, classNames, isSubmitting, passwordValidation, redirectTo, setIsSubmitting }: SignUpFormProperties) => {
    const isHydrated = useIsHydrated();
    const { captchaRef, getCaptchaHeaders } = useCaptcha();

    const {
        additionalFields,
        authClient,
        avatar,
        basePath,
        baseURL,
        credentials,
        emailVerification,
        nameRequired,
        navigate,
        persistClient,
        redirectTo: contextRedirectTo,
        signUp: signUpOptions,
        toast,
        viewPaths,
    } = useAuth();

    const search = useSearch({ strict: false }) as any;

    const confirmPasswordEnabled = credentials?.confirmPassword;
    const usernameEnabled = credentials?.username;
    const contextPasswordValidation = credentials?.passwordValidation;
    const signUpFields = signUpOptions?.fields;

    passwordValidation = { ...contextPasswordValidation, ...passwordValidation };

    // Avatar upload state
    const fileInputReference = useRef<HTMLInputElement>(null);
    const [avatarImage, setAvatarImage] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const getRedirectTo = useCallback(() => redirectTo || search?.redirectTo || contextRedirectTo, [redirectTo, search?.redirectTo, contextRedirectTo]);

    const getCallbackURL = useCallback(
        () => `${baseURL}${callbackURL || (persistClient ? `${basePath}/${viewPaths.CALLBACK}?redirectTo=${getRedirectTo()}` : getRedirectTo())}`,
        [callbackURL, persistClient, basePath, viewPaths, baseURL, getRedirectTo],
    );

    const { isPending: transitionPending, onSuccess } = useOnSuccessTransition({
        redirectTo,
    });

    // Create the base schema for standard fields
    const schemaFields: Record<string, z.ZodTypeAny> = {
        email: z
            .string()
            .min(1, {
                message: t`Email is required`,
            })
            .email({
                message: t`Email is invalid`,
            }),
        password: (() => {
            let schema = z.string().min(1, {
                message: t`Password is required`,
            });

            if (passwordValidation?.minLength) {
                schema = schema.min(passwordValidation.minLength, {
                    message: t`Password is too short`,
                });
            }

            if (passwordValidation?.maxLength) {
                schema = schema.max(passwordValidation.maxLength, {
                    message: t`Password is too long`,
                });
            }

            if (passwordValidation?.regex) {
                schema = schema.regex(passwordValidation.regex, {
                    message: t`Invalid password`,
                });
            }

            return schema;
        })(),
    };

    // Add confirmPassword field if enabled
    if (confirmPasswordEnabled) {
        schemaFields.confirmPassword = (() => {
            let schema = z.string().min(1, {
                message: t`Confirm password is required`,
            });

            if (passwordValidation?.minLength) {
                schema = schema.min(passwordValidation.minLength, {
                    message: t`Password is too short`,
                });
            }

            if (passwordValidation?.maxLength) {
                schema = schema.max(passwordValidation.maxLength, {
                    message: t`Password is too long`,
                });
            }

            if (passwordValidation?.regex) {
                schema = schema.regex(passwordValidation.regex, {
                    message: t`Invalid password`,
                });
            }

            return schema;
        })();
    }

    // Add name field if required or included in signUpFields
    if (signUpFields?.includes("name")) {
        schemaFields.name = nameRequired
            ? z.string().min(1, {
                message: t`Name is required`,
            })
            : z.string().optional();
    }

    // Add username field if enabled
    if (usernameEnabled) {
        schemaFields.username = z.string().min(1, {
            message: t`Username is required`,
        });
    }

    // Add image field if included in signUpFields
    if (signUpFields?.includes("image") && avatar) {
        schemaFields.image = z.string().optional();
    }

    // Add additional fields from signUpFields
    if (signUpFields) {
        for (const field of signUpFields) {
            if (field === "name")
                continue; // Already handled above

            if (field === "image")
                continue; // Already handled above

            const additionalField = additionalFields?.[field];

            if (!additionalField)
                continue;

            let fieldSchema: z.ZodTypeAny;

            // Create the appropriate schema based on field type
            if (additionalField.type === "number") {
                fieldSchema = additionalField.required
                    ? z.preprocess(
                        (value) => (value ? Number(value) : undefined),
                        z.number({
                            invalid_type_error: `${String(additionalField.label || "")} ${t`is invalid`}`,
                            required_error: `${String(additionalField.label || "")} ${t`is required`}`,
                        }),
                    )
                    : z.coerce
                        .number({
                            invalid_type_error: `${String(additionalField.label || "")} ${t`is invalid`}`,
                        })
                        .optional();
            } else if (additionalField.type === "boolean") {
                fieldSchema = additionalField.required
                    ? z.coerce
                        .boolean({
                            invalid_type_error: `${String(additionalField.label || "")} ${t`is invalid`}`,
                            required_error: `${String(additionalField.label || "")} ${t`is required`}`,
                        })
                        .refine((value) => value === true, {
                            message: `${String(additionalField.label || "")} ${t`is required`}`,
                        })
                    : z.coerce
                        .boolean({
                            invalid_type_error: `${String(additionalField.label || "")} ${t`is invalid`}`,
                        })
                        .optional();
            } else {
                fieldSchema = additionalField.required
                    ? z.string().min(1, {
                        message: `${String(additionalField.label || "")} ${t`is required`}`,
                    })
                    : z.string().optional();
            }

            schemaFields[field] = fieldSchema;
        }
    }

    // Create the final schema
    const formSchema = z.object(schemaFields).refine((data) => !confirmPasswordEnabled || data.password === data.confirmPassword, {
        message: t`Passwords do not match`,
        path: ["confirmPassword"],
    });

    // Create default values
    const defaultValues: Record<string, any> = {
        email: "",
        password: "",
        ...confirmPasswordEnabled && { confirmPassword: "" },
        ...signUpFields?.includes("name") && { name: "" },
        ...usernameEnabled && { username: "" },
        ...signUpFields?.includes("image") && avatar && { image: "" },
    };

    // Add default values for additional fields
    if (signUpFields) {
        for (const field of signUpFields) {
            if (field === "name" || field === "image")
                continue;

            const additionalField = additionalFields?.[field];

            if (!additionalField)
                continue;

            if (additionalField.type === "boolean") {
                defaultValues[field] = false;
            } else if (additionalField.type === "number") {
                defaultValues[field] = "";
            } else {
                defaultValues[field] = "";
            }
        }
    }

    const form = useAppForm({
        defaultValues,
        onSubmit: async ({ value }) => {
            try {
                // Validate additional fields with custom validators if provided
                for (const [field, fieldValue] of Object.entries(value)) {
                    if (
                        field === "email"
                        || field === "password"
                        || field === "confirmPassword"
                        || field === "name"
                        || field === "username"
                        || field === "image"
                    ) {
                        continue;
                    }

                    const additionalField = additionalFields?.[field];

                    if (!additionalField?.validate)
                        continue;

                    if (typeof fieldValue === "string" && !await additionalField.validate(fieldValue)) {
                        toast({
                            message: `${String(additionalField.label || "")} ${t`is invalid`}`,
                            variant: "error",
                        });

                        return;
                    }
                }

                const fetchOptions: BetterFetchOption = {
                    headers: await getCaptchaHeaders("/sign-up/email"),
                    throw: true,
                };

                const { confirmPassword, email, image, name, password, username, ...additionalFieldValues } = value;

                const data = await authClient.signUp.email({
                    email,
                    name: name || "",
                    password,
                    ...username !== undefined && { username },
                    ...image !== undefined && { image },
                    ...additionalFieldValues,
                    callbackURL: getCallbackURL(),
                    fetchOptions,
                });

                if ("token" in data && data.token) {
                    await onSuccess();
                } else {
                    if (emailVerification) {
                        toast({
                            message: t`Email verification sent`,
                            variant: "success",
                        });
                    } else {
                        toast({
                            message: t`Sign up successful`,
                            variant: "success",
                        });
                    }

                    navigate(`${basePath}/${viewPaths.SIGN_IN}${globalThis.location.search}`);
                }
            } catch (error) {
                toast({
                    message: getLocalizedError({ error }),
                    variant: "error",
                });

                form.reset();
            }
        },
        validators: {
            onChange: ({ value }) => formSchema.safeParse(value),
        },
    });

    isSubmitting = isSubmitting || form.state.isSubmitting || transitionPending;

    useEffect(() => {
        setIsSubmitting?.(form.state.isSubmitting || transitionPending);
    }, [form.state.isSubmitting, transitionPending, setIsSubmitting]);

    const handleAvatarChange = async (file: File) => {
        if (!file)
            return;

        setUploadingAvatar(true);

        try {
            const resizedFile = await resizeAndCropImage(file, crypto.randomUUID(), 200, "webp");
            const base64 = await fileToBase64(resizedFile);

            setAvatarImage(base64);
            form.setFieldValue("image", base64);
        } catch {
            toast({
                message: "Failed to upload avatar",
                variant: "error",
            });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleDeleteAvatar = () => {
        setAvatarImage(null);
        form.setFieldValue("image", "");
    };

    const openFileDialog = () => fileInputReference.current?.click();

    return (
        <form.AppForm>
            <form
                className={cn("grid w-full gap-6", className, classNames?.base)}
                noValidate={isHydrated}
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                {signUpFields?.includes("image") && avatar && (
                    <>
                        <input
                            accept="image/*"
                            disabled={uploadingAvatar}
                            hidden
                            onChange={(e) => {
                                const file = e.target.files?.item(0);

                                if (file)
                                    handleAvatarChange(file);

                                e.target.value = "";
                            }}
                            ref={fileInputReference}
                            type="file"
                        />

                        <form.AppField
                            children={() => (
                                <div className="space-y-2">
                                    <label className={cn("text-sm font-medium", classNames?.label)}>{t`Avatar`}</label>

                                    <div className="flex items-center gap-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button className="size-fit rounded-full" size="icon" type="button" variant="ghost">
                                                    <form.Subscribe
                                                        children={({ email, name }) => (
                                                            <Avatar className="size-16">
                                                                {avatarImage && <AvatarImage alt={name || "User"} src={avatarImage} />}
                                                                <AvatarFallback className="rounded-lg">{name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                                                            </Avatar>
                                                        )}
                                                        selector={(state) => {
                                                            return {
                                                                email: state.values.email || "",
                                                                name: state.values.name || "",
                                                            };
                                                        }}
                                                    />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
                                                <DropdownMenuItem disabled={uploadingAvatar} onClick={openFileDialog}>
                                                    <UploadCloudIcon />
                                                    {t`Upload Avatar`}
                                                </DropdownMenuItem>

                                                {avatarImage && (
                                                    <DropdownMenuItem disabled={uploadingAvatar} onClick={handleDeleteAvatar} variant="destructive">
                                                        <Trash2Icon />
                                                        {t`Delete Avatar`}
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <Button disabled={uploadingAvatar} onClick={openFileDialog} type="button" variant="outline">
                                            {uploadingAvatar && <Loader2 className="animate-spin" />}

                                            {t`Upload`}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            name="image"
                        />
                    </>
                )}

                {signUpFields?.includes("name") && (
                    <form.AppField
                        children={(field) => (
                            <field.FormItem>
                                <field.FormLabel className={classNames?.label}>{t`Name`}</field.FormLabel>

                                <field.FormControl>
                                    <Input
                                        autoComplete="name"
                                        className={classNames?.input}
                                        disabled={isSubmitting}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder={t`Enter your name`}
                                        value={field.state.value}
                                    />
                                </field.FormControl>

                                <field.FormMessage className={classNames?.error} />
                            </field.FormItem>
                        )}
                        name="name"
                    />
                )}

                {usernameEnabled && (
                    <form.AppField
                        children={(field) => (
                            <field.FormItem>
                                <field.FormLabel className={classNames?.label}>{t`Username`}</field.FormLabel>

                                <field.FormControl>
                                    <Input
                                        autoComplete="username"
                                        className={classNames?.input}
                                        disabled={isSubmitting}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder={t`Enter your username`}
                                        value={field.state.value}
                                    />
                                </field.FormControl>

                                <field.FormMessage className={classNames?.error} />
                            </field.FormItem>
                        )}
                        name="username"
                    />
                )}

                <form.AppField
                    children={(field) => (
                        <field.FormItem>
                            <field.FormLabel className={classNames?.label}>{t`Email`}</field.FormLabel>

                            <field.FormControl>
                                <Input
                                    autoComplete="email"
                                    className={classNames?.input}
                                    disabled={isSubmitting}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t`Enter your email`}
                                    type="email"
                                    value={field.state.value}
                                />
                            </field.FormControl>

                            <field.FormMessage className={classNames?.error} />
                        </field.FormItem>
                    )}
                    name="email"
                />

                <form.AppField
                    children={(field) => (
                        <field.FormItem>
                            <field.FormLabel className={classNames?.label}>{t`Password`}</field.FormLabel>

                            <field.FormControl>
                                <PasswordInput
                                    autoComplete="new-password"
                                    className={classNames?.input}
                                    disabled={isSubmitting}
                                    enableToggle
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t`Enter your password`}
                                    value={field.state.value}
                                />
                            </field.FormControl>

                            <field.FormMessage className={classNames?.error} />
                        </field.FormItem>
                    )}
                    name="password"
                />

                {confirmPasswordEnabled && (
                    <form.AppField
                        children={(field) => (
                            <field.FormItem>
                                <field.FormLabel className={classNames?.label}>{t`Confirm Password`}</field.FormLabel>

                                <field.FormControl>
                                    <PasswordInput
                                        autoComplete="new-password"
                                        className={classNames?.input}
                                        disabled={isSubmitting}
                                        enableToggle
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder={t`Enter your password again`}
                                        value={field.state.value}
                                    />
                                </field.FormControl>

                                <field.FormMessage className={classNames?.error} />
                            </field.FormItem>
                        )}
                        name="confirmPassword"
                    />
                )}

                {signUpFields
                    ?.filter((field) => field !== "name" && field !== "image")
                    .map((field) => {
                        const additionalField = additionalFields?.[field];

                        if (!additionalField) {
                            console.error(`Additional field ${field} not found`);

                            return null;
                        }

                        return additionalField.type === "boolean"
                            ? (
                                <form.AppField
                                    children={(formField) => (
                                        <formField.FormItem className="flex">
                                            <formField.FormControl>
                                                <Checkbox
                                                    checked={formField.state.value}
                                                    disabled={isSubmitting}
                                                    onCheckedChange={(checked) => formField.handleChange(checked === true)}
                                                />
                                            </formField.FormControl>

                                            <formField.FormLabel className={classNames?.label}>{String(additionalField.label || "")}</formField.FormLabel>

                                            <formField.FormMessage className={classNames?.error} />
                                        </formField.FormItem>
                                    )}
                                    key={field}
                                    name={field}
                                />
                            )
                            : (
                                <form.AppField
                                    children={(formField) => (
                                        <formField.FormItem>
                                            <formField.FormLabel className={classNames?.label}>{String(additionalField.label || "")}</formField.FormLabel>

                                            <formField.FormControl>
                                                <Input
                                                    className={classNames?.input}
                                                    disabled={isSubmitting}
                                                    onBlur={formField.handleBlur}
                                                    onChange={(e) => formField.handleChange(e.target.value)}
                                                    placeholder={
                                                    additionalField.placeholder || (typeof additionalField.label === "string" ? additionalField.label : "")
                                                }
                                                    type={additionalField.type === "number" ? "number" : "text"}
                                                    value={formField.state.value}
                                                />
                                            </formField.FormControl>

                                            <formField.FormMessage className={classNames?.error} />
                                        </formField.FormItem>
                                    )}
                                    key={field}
                                    name={field}
                                />
                            );
                    })}

                <Captcha action="/sign-up/email" ref={captchaRef} />

                <form.Subscribe
                    children={([canSubmit, isSubmitting]) => (
                        <Button className={cn("w-full", classNames?.button, classNames?.primaryButton)} disabled={!canSubmit || isSubmitting} type="submit">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : t`Sign Up`}
                        </Button>
                    )}
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                />
            </form>
        </form.AppForm>
    );
};
