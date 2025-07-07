"use client";

import type { BetterFetchOption } from "better-auth/react";
import { Loader2 } from "lucide-react";
import { Trash2Icon, UploadCloudIcon } from "lucide-react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import * as z from "zod";

import { useCaptcha } from "../../../hooks/use-captcha";
import { useIsHydrated } from "../../../hooks/use-hydrated";
import { useOnSuccessTransition } from "../../../hooks/use-success-transition";
import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { fileToBase64, resizeAndCropImage } from "../../../lib/image-utils";
import { cn } from "@/lib/utils";
import { getLocalizedError, getPasswordSchema, getSearchParam } from "../../../lib/utils";
import type { AuthLocalization } from "../../../localization/auth-localization";
import type { PasswordValidation } from "../../../types/form-validation-types";
import { Captcha } from "../../captcha/captcha";
import { PasswordInput } from "../../password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "../../user-avatar";
import type { AuthFormClassNames } from "../auth-form";

export interface SignUpFormProps {
    className?: string;
    classNames?: AuthFormClassNames;
    callbackURL?: string;
    isSubmitting?: boolean;
    localization: Partial<AuthLocalization>;
    redirectTo?: string;
    setIsSubmitting?: (value: boolean) => void;
    passwordValidation?: PasswordValidation;
}

export function SignUpForm({
    className,
    classNames,
    callbackURL,
    isSubmitting,
    localization,
    redirectTo,
    setIsSubmitting,
    passwordValidation,
}: SignUpFormProps) {
    const isHydrated = useIsHydrated();
    const { captchaRef, getCaptchaHeaders } = useCaptcha({ localization });

    const {
        additionalFields,
        authClient,
        basePath,
        baseURL,
        credentials,
        emailVerification,
        localization: contextLocalization,
        nameRequired,
        persistClient,
        redirectTo: contextRedirectTo,
        signUp: signUpOptions,
        viewPaths,
        navigate,
        toast,
        avatar,
    } = useContext(AuthUIContext);

    const confirmPasswordEnabled = credentials?.confirmPassword;
    const usernameEnabled = credentials?.username;
    const contextPasswordValidation = credentials?.passwordValidation;
    const signUpFields = signUpOptions?.fields;

    localization = { ...contextLocalization, ...localization };
    passwordValidation = { ...contextPasswordValidation, ...passwordValidation };

    // Avatar upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarImage, setAvatarImage] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const getRedirectTo = useCallback(() => redirectTo || getSearchParam("redirectTo") || contextRedirectTo, [redirectTo, contextRedirectTo]);

    const getCallbackURL = useCallback(
        () => `${baseURL}${callbackURL || (persistClient ? `${basePath}/${viewPaths.CALLBACK}?redirectTo=${getRedirectTo()}` : getRedirectTo())}`,
        [callbackURL, persistClient, basePath, viewPaths, baseURL, getRedirectTo],
    );

    const { onSuccess, isPending: transitionPending } = useOnSuccessTransition({
        redirectTo,
    });

    // Create the base schema for standard fields
    const schemaFields: Record<string, z.ZodTypeAny> = {
        email: z
            .string()
            .min(1, {
                message: `${localization.EMAIL} ${localization.IS_REQUIRED}`,
            })
            .email({
                message: `${localization.EMAIL} ${localization.IS_INVALID}`,
            }),
        password: getPasswordSchema(passwordValidation, localization),
    };

    // Add confirmPassword field if enabled
    if (confirmPasswordEnabled) {
        schemaFields.confirmPassword = getPasswordSchema(passwordValidation, {
            PASSWORD_REQUIRED: localization.CONFIRM_PASSWORD_REQUIRED,
            PASSWORD_TOO_SHORT: localization.PASSWORD_TOO_SHORT,
            PASSWORD_TOO_LONG: localization.PASSWORD_TOO_LONG,
            INVALID_PASSWORD: localization.INVALID_PASSWORD,
        });
    }

    // Add name field if required or included in signUpFields
    if (signUpFields?.includes("name")) {
        schemaFields.name = nameRequired
            ? z.string().min(1, {
                  message: `${localization.NAME} ${localization.IS_REQUIRED}`,
              })
            : z.string().optional();
    }

    // Add username field if enabled
    if (usernameEnabled) {
        schemaFields.username = z.string().min(1, {
            message: `${localization.USERNAME} ${localization.IS_REQUIRED}`,
        });
    }

    // Add image field if included in signUpFields
    if (signUpFields?.includes("image") && avatar) {
        schemaFields.image = z.string().optional();
    }

    // Add additional fields from signUpFields
    if (signUpFields) {
        for (const field of signUpFields) {
            if (field === "name") continue; // Already handled above
            if (field === "image") continue; // Already handled above

            const additionalField = additionalFields?.[field];
            if (!additionalField) continue;

            let fieldSchema: z.ZodTypeAny;

            // Create the appropriate schema based on field type
            if (additionalField.type === "number") {
                fieldSchema = additionalField.required
                    ? z.preprocess(
                          (val) => (!val ? undefined : Number(val)),
                          z.number({
                              required_error: `${additionalField.label} ${localization.IS_REQUIRED}`,
                              invalid_type_error: `${additionalField.label} ${localization.IS_INVALID}`,
                          }),
                      )
                    : z.coerce
                          .number({
                              invalid_type_error: `${additionalField.label} ${localization.IS_INVALID}`,
                          })
                          .optional();
            } else if (additionalField.type === "boolean") {
                fieldSchema = additionalField.required
                    ? z.coerce
                          .boolean({
                              required_error: `${additionalField.label} ${localization.IS_REQUIRED}`,
                              invalid_type_error: `${additionalField.label} ${localization.IS_INVALID}`,
                          })
                          .refine((val) => val === true, {
                              message: `${additionalField.label} ${localization.IS_REQUIRED}`,
                          })
                    : z.coerce
                          .boolean({
                              invalid_type_error: `${additionalField.label} ${localization.IS_INVALID}`,
                          })
                          .optional();
            } else {
                fieldSchema = additionalField.required
                    ? z.string().min(1, {
                          message: `${additionalField.label} ${localization.IS_REQUIRED}`,
                      })
                    : z.string().optional();
            }

            schemaFields[field] = fieldSchema;
        }
    }

    // Create the final schema
    const formSchema = z.object(schemaFields).refine((data) => !confirmPasswordEnabled || data.password === data.confirmPassword, {
        message: localization.PASSWORDS_DO_NOT_MATCH,
        path: ["confirmPassword"],
    });

    // Create default values
    const defaultValues: Record<string, any> = {
        email: "",
        password: "",
        ...(confirmPasswordEnabled && { confirmPassword: "" }),
        ...(signUpFields?.includes("name") && { name: "" }),
        ...(usernameEnabled && { username: "" }),
        ...(signUpFields?.includes("image") && avatar && { image: "" }),
    };

    // Add default values for additional fields
    if (signUpFields) {
        for (const field of signUpFields) {
            if (field === "name" || field === "image") continue;
            const additionalField = additionalFields?.[field];
            if (!additionalField) continue;

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
        validators: {
            onChange: ({ value }) => formSchema.safeParse(value),
        },
        onSubmit: async ({ value }) => {
            try {
                // Validate additional fields with custom validators if provided
                for (const [field, fieldValue] of Object.entries(value)) {
                    if (
                        field === "email" ||
                        field === "password" ||
                        field === "confirmPassword" ||
                        field === "name" ||
                        field === "username" ||
                        field === "image"
                    )
                        continue;

                    const additionalField = additionalFields?.[field];
                    if (!additionalField?.validate) continue;

                    if (typeof fieldValue === "string" && !(await additionalField.validate(fieldValue))) {
                        toast({
                            variant: "error",
                            message: `${additionalField.label} ${localization.IS_INVALID}`,
                        });
                        return;
                    }
                }

                const fetchOptions: BetterFetchOption = {
                    throw: true,
                    headers: await getCaptchaHeaders("/sign-up/email"),
                };

                const { email, password, name, username, image, confirmPassword, ...additionalFieldValues } = value;

                const data = await authClient.signUp.email({
                    email,
                    password,
                    name: name || "",
                    ...(username !== undefined && { username }),
                    ...(image !== undefined && { image }),
                    ...additionalFieldValues,
                    callbackURL: getCallbackURL(),
                    fetchOptions,
                });

                if ("token" in data && data.token) {
                    await onSuccess();
                } else {
                    if (emailVerification) {
                        toast({
                            variant: "success",
                            message: localization.EMAIL_VERIFICATION!,
                        });
                    } else {
                        toast({
                            variant: "success",
                            message: localization.SIGN_UP_EMAIL!,
                        });
                    }

                    navigate(`${basePath}/${viewPaths.SIGN_IN}${window.location.search}`);
                }
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error, localization }),
                });

                form.reset();
            }
        },
    });

    isSubmitting = isSubmitting || form.state.isSubmitting || transitionPending;

    useEffect(() => {
        setIsSubmitting?.(form.state.isSubmitting || transitionPending);
    }, [form.state.isSubmitting, transitionPending, setIsSubmitting]);

    const handleAvatarChange = async (file: File) => {
        if (!file) return;

        setUploadingAvatar(true);

        try {
            const resizedFile = await resizeAndCropImage(file, crypto.randomUUID(), 200, "webp");
            const base64 = await fileToBase64(resizedFile);

            setAvatarImage(base64);
            form.setFieldValue("image", base64);
        } catch (error) {
            toast({
                variant: "error",
                message: "Failed to upload avatar",
            });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleDeleteAvatar = () => {
        setAvatarImage(null);
        form.setFieldValue("image", "");
    };

    const openFileDialog = () => fileInputRef.current?.click();

    return (
        <form.AppForm>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
                noValidate={isHydrated}
                className={cn("grid w-full gap-6", className, classNames?.base)}
            >
                {signUpFields?.includes("image") && avatar && (
                    <>
                        <input
                            ref={fileInputRef}
                            accept="image/*"
                            disabled={uploadingAvatar}
                            hidden
                            type="file"
                            onChange={(e) => {
                                const file = e.target.files?.item(0);
                                if (file) handleAvatarChange(file);
                                e.target.value = "";
                            }}
                        />

                        <form.AppField
                            name="image"
                            children={() => (
                                <div className="space-y-2">
                                    <label className={cn("text-sm font-medium", classNames?.label)}>{localization.AVATAR}</label>

                                    <div className="flex items-center gap-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button className="size-fit rounded-full" size="icon" variant="ghost" type="button">
                                                    <form.Subscribe
                                                        selector={(state) => ({
                                                            name: state.values.name || "",
                                                            email: state.values.email || "",
                                                        })}
                                                        children={({ name, email }) => (
                                                            <UserAvatar
                                                                isPending={uploadingAvatar}
                                                                className="size-16"
                                                                user={
                                                                    avatarImage
                                                                        ? {
                                                                              name,
                                                                              email,
                                                                              image: avatarImage,
                                                                          }
                                                                        : null
                                                                }
                                                                localization={localization}
                                                            />
                                                        )}
                                                    />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
                                                <DropdownMenuItem onClick={openFileDialog} disabled={uploadingAvatar}>
                                                    <UploadCloudIcon />
                                                    {localization.UPLOAD_AVATAR}
                                                </DropdownMenuItem>

                                                {avatarImage && (
                                                    <DropdownMenuItem onClick={handleDeleteAvatar} disabled={uploadingAvatar} variant="destructive">
                                                        <Trash2Icon />
                                                        {localization.DELETE_AVATAR}
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <Button type="button" variant="outline" onClick={openFileDialog} disabled={uploadingAvatar}>
                                            {uploadingAvatar && <Loader2 className="animate-spin" />}

                                            {localization.UPLOAD}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        />
                    </>
                )}

                {signUpFields?.includes("name") && (
                    <form.AppField
                        name="name"
                        children={(field) => (
                            <field.FormItem>
                                <field.FormLabel className={classNames?.label}>{localization.NAME}</field.FormLabel>

                                <field.FormControl>
                                    <Input
                                        className={classNames?.input}
                                        placeholder={localization.NAME_PLACEHOLDER}
                                        autoComplete="name"
                                        disabled={isSubmitting}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                </field.FormControl>

                                <field.FormMessage className={classNames?.error} />
                            </field.FormItem>
                        )}
                    />
                )}

                {usernameEnabled && (
                    <form.AppField
                        name="username"
                        children={(field) => (
                            <field.FormItem>
                                <field.FormLabel className={classNames?.label}>{localization.USERNAME}</field.FormLabel>

                                <field.FormControl>
                                    <Input
                                        className={classNames?.input}
                                        placeholder={localization.USERNAME_PLACEHOLDER}
                                        autoComplete="username"
                                        disabled={isSubmitting}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                </field.FormControl>

                                <field.FormMessage className={classNames?.error} />
                            </field.FormItem>
                        )}
                    />
                )}

                <form.AppField
                    name="email"
                    children={(field) => (
                        <field.FormItem>
                            <field.FormLabel className={classNames?.label}>{localization.EMAIL}</field.FormLabel>

                            <field.FormControl>
                                <Input
                                    className={classNames?.input}
                                    type="email"
                                    placeholder={localization.EMAIL_PLACEHOLDER}
                                    autoComplete="email"
                                    disabled={isSubmitting}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                            </field.FormControl>

                            <field.FormMessage className={classNames?.error} />
                        </field.FormItem>
                    )}
                />

                <form.AppField
                    name="password"
                    children={(field) => (
                        <field.FormItem>
                            <field.FormLabel className={classNames?.label}>{localization.PASSWORD}</field.FormLabel>

                            <field.FormControl>
                                <PasswordInput
                                    autoComplete="new-password"
                                    className={classNames?.input}
                                    placeholder={localization.PASSWORD_PLACEHOLDER}
                                    disabled={isSubmitting}
                                    enableToggle
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                            </field.FormControl>

                            <field.FormMessage className={classNames?.error} />
                        </field.FormItem>
                    )}
                />

                {confirmPasswordEnabled && (
                    <form.AppField
                        name="confirmPassword"
                        children={(field) => (
                            <field.FormItem>
                                <field.FormLabel className={classNames?.label}>{localization.CONFIRM_PASSWORD}</field.FormLabel>

                                <field.FormControl>
                                    <PasswordInput
                                        autoComplete="new-password"
                                        className={classNames?.input}
                                        placeholder={localization.CONFIRM_PASSWORD_PLACEHOLDER}
                                        disabled={isSubmitting}
                                        enableToggle
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                </field.FormControl>

                                <field.FormMessage className={classNames?.error} />
                            </field.FormItem>
                        )}
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

                        return additionalField.type === "boolean" ? (
                            <form.AppField
                                key={field}
                                name={field}
                                children={(formField) => (
                                    <formField.FormItem className="flex">
                                        <formField.FormControl>
                                            <Checkbox
                                                checked={formField.state.value}
                                                onCheckedChange={(checked) => formField.handleChange(checked === true)}
                                                disabled={isSubmitting}
                                            />
                                        </formField.FormControl>

                                        <formField.FormLabel className={classNames?.label}>{additionalField.label}</formField.FormLabel>

                                        <formField.FormMessage className={classNames?.error} />
                                    </formField.FormItem>
                                )}
                            />
                        ) : (
                            <form.AppField
                                key={field}
                                name={field}
                                children={(formField) => (
                                    <formField.FormItem>
                                        <formField.FormLabel className={classNames?.label}>{additionalField.label}</formField.FormLabel>

                                        <formField.FormControl>
                                            <Input
                                                className={classNames?.input}
                                                type={additionalField.type === "number" ? "number" : "text"}
                                                placeholder={
                                                    additionalField.placeholder || (typeof additionalField.label === "string" ? additionalField.label : "")
                                                }
                                                disabled={isSubmitting}
                                                value={formField.state.value}
                                                onBlur={formField.handleBlur}
                                                onChange={(e) => formField.handleChange(e.target.value)}
                                            />
                                        </formField.FormControl>

                                        <formField.FormMessage className={classNames?.error} />
                                    </formField.FormItem>
                                )}
                            />
                        );
                    })}

                <Captcha ref={captchaRef} localization={localization} action="/sign-up/email" />

                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isSubmitting]) => (
                        <Button type="submit" disabled={!canSubmit || isSubmitting} className={cn("w-full", classNames?.button, classNames?.primaryButton)}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : localization.SIGN_UP_ACTION}
                        </Button>
                    )}
                />
            </form>
        </form.AppForm>
    );
}
