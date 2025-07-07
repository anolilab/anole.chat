"use client"

import { Loader2 } from "lucide-react"
import { useContext, useEffect, useState } from "react"
import * as z from "zod"

import { useIsHydrated } from "../../../hooks/use-hydrated"
import { useOnSuccessTransition } from "../../../hooks/use-success-transition"
import { AuthUIContext } from "../../../lib/auth-ui-provider"
import { cn } from "@/lib/utils"
import { getLocalizedError } from "../../../lib/utils"
import type { AuthLocalization } from "../../../localization/auth-localization"
import { Button } from "@/components/ui/button"
import { useAppForm } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { InputOTP } from "@/components/ui/input-otp"
import type { AuthFormClassNames } from "../auth-form"
import { OTPInputGroup } from "../otp-input-group"

export interface EmailOTPFormProps {
    className?: string
    classNames?: AuthFormClassNames
    callbackURL?: string
    isSubmitting?: boolean
    localization: Partial<AuthLocalization>
    otpSeparators?: 0 | 1 | 2
    redirectTo?: string
    setIsSubmitting?: (value: boolean) => void
}

export function EmailOTPForm(props: EmailOTPFormProps) {
    const [email, setEmail] = useState<string | undefined>()

    if (!email) {
        return <EmailForm {...props} setEmail={setEmail} />
    }

    return <OTPForm {...props} email={email} />
}

function EmailForm({
    className,
    classNames,
    isSubmitting,
    localization,
    setIsSubmitting,
    setEmail
}: EmailOTPFormProps & {
    setEmail: (email: string) => void
}) {
    const isHydrated = useIsHydrated()

    const {
        authClient,
        localization: contextLocalization,
        toast
    } = useContext(AuthUIContext)

    localization = { ...contextLocalization, ...localization }

    const formSchema = z.object({
        email: z
            .string()
            .min(1, {
                message: `${localization.EMAIL} ${localization.IS_REQUIRED}`
            })
            .email({
                message: `${localization.EMAIL} ${localization.IS_INVALID}`
            })
    })

    const form = useAppForm({
        defaultValues: {
            email: ""
        },
        validators: {
            onChange: ({ value }) => {
                const result = formSchema.safeParse(value)
                if (!result.success) {
                    return result.error.flatten().fieldErrors
                }
                return undefined
            },
        },
        onSubmit: async ({ value }) => {
            try {
                await authClient.emailOtp.sendVerificationOtp({
                    email: value.email,
                    type: "sign-in",
                    fetchOptions: { throw: true }
                })

                toast({
                    variant: "success",
                    message: localization.EMAIL_OTP_VERIFICATION_SENT
                })

                setEmail(value.email)
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error, localization })
                })
            }
        },
    })

    useEffect(() => {
        form.Subscribe({
            selector: (state) => state.isSubmitting,
            children: (isFormSubmitting) => {
                setIsSubmitting?.(isFormSubmitting)
                return null
            }
        })
    }, [setIsSubmitting])

    return (
        <form.AppForm>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                }}
                noValidate={isHydrated}
                className={cn("grid w-full gap-6", className, classNames?.base)}
            >
                <form.AppField
                    name="email"
                    children={(field) => (
                        <field.FormItem>
                            <field.FormLabel className={classNames?.label}>
                                {localization.EMAIL}
                            </field.FormLabel>

                            <field.FormControl>
                                <Input
                                    className={classNames?.input}
                                    type="email"
                                    autoComplete="email"
                                    placeholder={localization.EMAIL_PLACEHOLDER}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </field.FormControl>

                            <field.FormMessage className={classNames?.error} />
                        </field.FormItem>
                    )}
                />

                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isFormSubmitting]) => (
                        <Button
                            type="submit"
                            disabled={!canSubmit || isSubmitting}
                            className={cn(
                                "w-full",
                                classNames?.button,
                                classNames?.primaryButton
                            )}
                        >
                            {(isFormSubmitting || isSubmitting) ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                localization.EMAIL_OTP_SEND_ACTION
                            )}
                        </Button>
                    )}
                />
            </form>
        </form.AppForm>
    )
}

export function OTPForm({
    className,
    classNames,
    isSubmitting,
    localization,
    otpSeparators = 0,
    redirectTo,
    setIsSubmitting,
    email
}: EmailOTPFormProps & {
    email: string
}) {
    const {
        authClient,
        localization: contextLocalization,
        toast
    } = useContext(AuthUIContext)

    localization = { ...contextLocalization, ...localization }

    const { onSuccess, isPending: transitionPending } = useOnSuccessTransition({
        redirectTo
    })

    const formSchema = z.object({
        code: z
            .string()
            .min(1, {
                message: `${localization.EMAIL_OTP} ${localization.IS_REQUIRED}`
            })
            .min(6, {
                message: `${localization.EMAIL_OTP} ${localization.IS_INVALID}`
            })
    })

    const form = useAppForm({
        defaultValues: {
            code: ""
        },
        validators: {
            onChange: ({ value }: { value: { code: string } }) => {
                const result = formSchema.safeParse(value)
                if (!result.success) {
                    return result.error.flatten().fieldErrors
                }
                return undefined
            },
        },
        onSubmit: async ({ value }: { value: { code: string } }) => {
            try {
                await authClient.signIn.emailOtp({
                    email,
                    otp: value.code,
                    fetchOptions: { throw: true }
                })

                await onSuccess()
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error, localization })
                })

                form.reset()
            }
        },
    })

    useEffect(() => {
        form.Subscribe({
            selector: (state) => [state.isSubmitting, transitionPending],
            children: ([isFormSubmitting, isPending]) => {
                setIsSubmitting?.(isFormSubmitting || isPending)
                return null
            }
        })
    }, [setIsSubmitting, transitionPending])

    return (
        <form.AppForm>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                }}
                className={cn("grid w-full gap-6", className, classNames?.base)}
            >
                <form.AppField
                    name="code"
                    children={(field) => (
                        <field.FormItem>
                            <field.FormLabel className={classNames?.label}>
                                {localization.EMAIL_OTP}
                            </field.FormLabel>

                            <field.FormControl>
                                <InputOTP
                                    value={field.state.value}
                                    maxLength={6}
                                    onChange={(value) => {
                                        field.handleChange(value)

                                        if (value.length === 6) {
                                            form.handleSubmit()
                                        }
                                    }}
                                    containerClassName={
                                        classNames?.otpInputContainer
                                    }
                                    className={classNames?.otpInput}
                                    disabled={isSubmitting}
                                >
                                    <OTPInputGroup
                                        otpSeparators={otpSeparators}
                                    />
                                </InputOTP>
                            </field.FormControl>

                            <field.FormMessage className={classNames?.error} />
                        </field.FormItem>
                    )}
                />

                <div className="grid gap-4">
                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                        children={([canSubmit, isFormSubmitting]) => (
                            <Button
                                type="submit"
                                disabled={!canSubmit || isSubmitting}
                                className={cn(
                                    classNames?.button,
                                    classNames?.primaryButton
                                )}
                            >
                                {(isFormSubmitting || isSubmitting) && <Loader2 className="animate-spin" />}
                                {localization.EMAIL_OTP_VERIFY_ACTION}
                            </Button>
                        )}
                    />
                </div>
            </form>
        </form.AppForm>
    )
}
