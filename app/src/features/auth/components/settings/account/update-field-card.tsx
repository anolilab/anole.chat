"use client"

import { type ReactNode, useContext } from "react"
import * as z from "zod"

import { AuthUIContext } from "../../../lib/auth-ui-provider"
import { getLocalizedError } from "../../../lib/utils"
import { cn } from "@/lib/utils"
import type { AuthLocalization } from "../../../localization/auth-localization"
import type { FieldType } from "../../../types/form-validation-types"
import { CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useAppForm } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
    SettingsCard,
    type SettingsCardClassNames
} from "../shared/settings-card"

export interface UpdateFieldCardProps {
    className?: string
    classNames?: SettingsCardClassNames
    description?: ReactNode
    instructions?: ReactNode
    localization?: Partial<AuthLocalization>
    name: string
    placeholder?: string
    required?: boolean
    label?: ReactNode
    type?: FieldType
    value?: unknown
    validate?: (value: string) => boolean | Promise<boolean>
}

export function UpdateFieldCard({
    className,
    classNames,
    description,
    instructions,
    localization,
    name,
    placeholder,
    required,
    label,
    type,
    value,
    validate
}: UpdateFieldCardProps) {
    const {
        hooks: { useSession },
        mutators: { updateUser },
        localization: contextLocalization,
        optimistic,
        toast
    } = useContext(AuthUIContext)

    localization = { ...contextLocalization, ...localization }

    const { isPending, refetch } = useSession()

    // Create the appropriate schema based on type
    let fieldSchema = z.unknown() as z.ZodType<unknown>
    if (type === "number") {
        fieldSchema = required
            ? z.preprocess(
                (val) => (!val ? undefined : Number(val)),
                z.number({
                    required_error: `${label} ${localization.IS_REQUIRED}`,
                    invalid_type_error: `${label} ${localization.IS_INVALID}`
                })
            )
            : z.coerce
                .number({
                    invalid_type_error: `${label} ${localization.IS_INVALID}`
                })
                .optional()
    } else if (type === "boolean") {
        fieldSchema = required
            ? z.coerce
                .boolean({
                    required_error: `${label} ${localization.IS_REQUIRED}`,
                    invalid_type_error: `${label} ${localization.IS_INVALID}`
                })
                .refine((val) => val === true, {
                    message: `${label} ${localization.IS_REQUIRED}`
                })
            : z.coerce.boolean({
                invalid_type_error: `${label} ${localization.IS_INVALID}`
            })
    } else {
        fieldSchema = required
            ? z.string().min(1, `${label} ${localization.IS_REQUIRED}`)
            : z.string().optional()
    }

    const form = useAppForm({
        defaultValues: {
            [name]: value || ""
        },
        validators: {
            onChange: ({ value }) => {
                const result = fieldSchema.safeParse(value[name])
                if (!result.success) {
                    return { [name]: result.error.issues[0]?.message }
                }
                return undefined
            }
        },
        onSubmit: async ({ value: values }) => {
            await new Promise((resolve) => setTimeout(resolve))
            const newValue = values[name]

            if (value === newValue) {
                toast({
                    variant: "error",
                    message: `${label} ${localization.IS_THE_SAME}`
                })
                return
            }

            if (
                validate &&
                typeof newValue === "string" &&
                !(await validate(newValue))
            ) {
                form.setErrorMap({
                    [name]: `${label} ${localization.IS_INVALID}`
                })
                return
            }

            try {
                await updateUser({ [name]: newValue })

                await refetch?.()
                toast({
                    variant: "success",
                    message: `${label} ${localization.UPDATED_SUCCESSFULLY}`
                })
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error, localization })
                })
            }
        }
    })

    const isSubmitting = form.state.isSubmitting

    return (
        <form.AppForm>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                }}
            >
                <SettingsCard
                    className={className}
                    classNames={classNames}
                    description={description}
                    instructions={instructions}
                    isPending={isPending}
                    title={label}
                    actionLabel={localization.SAVE}
                    optimistic={optimistic}
                >
                    <CardContent className={classNames?.content}>
                        {type === "boolean" ? (
                            <form.AppField
                                name={name}
                                children={(field) => (
                                    <field.FormItem className="flex">
                                        <field.FormControl>
                                            <Checkbox
                                                checked={field.state.value as boolean}
                                                onCheckedChange={(checked) =>
                                                    field.handleChange(checked as boolean)
                                                }
                                                disabled={isSubmitting}
                                                className={classNames?.checkbox}
                                            />
                                        </field.FormControl>

                                        <field.FormLabel
                                            className={classNames?.label}
                                        >
                                            {label}
                                        </field.FormLabel>

                                        <field.FormMessage
                                            className={classNames?.error}
                                        />
                                    </field.FormItem>
                                )}
                            />
                        ) : isPending ? (
                            <Skeleton
                                className={cn(
                                    "h-9 w-full",
                                    classNames?.skeleton
                                )}
                            />
                        ) : (
                            <form.AppField
                                name={name}
                                children={(field) => (
                                    <field.FormItem>
                                        <field.FormControl>
                                            <Input
                                                className={classNames?.input}
                                                disabled={isSubmitting}
                                                placeholder={placeholder}
                                                type={type === "number" ? "number" : "text"}
                                                autoComplete={name === "name" ? "name" : name === "username" ? "username" : "off"}
                                                value={field.state.value as string}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                            />
                                        </field.FormControl>

                                        <field.FormMessage
                                            className={classNames?.error}
                                        />
                                    </field.FormItem>
                                )}
                            />
                        )}
                    </CardContent>
                </SettingsCard>
            </form>
        </form.AppForm>
    )
}
