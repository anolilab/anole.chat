"use client"

import { useContext } from "react"
import * as z from "zod"

import { AuthUIContext } from "../../lib/auth-ui-provider"
import { cn } from "@/lib/utils"
import { getLocalizedError } from "../../lib/utils"
import {
    SettingsCard,
    type SettingsCardProps
} from "../settings/shared/settings-card"
import { CardContent } from "@/components/ui/card"
import { useAppForm } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

export function OrganizationSlugCard({
    className,
    classNames,
    localization: localizationProp,
    ...props
}: SettingsCardProps) {
    const {
        hooks: { useActiveOrganization },
        localization: contextLocalization
    } = useContext(AuthUIContext)

    const localization = { ...contextLocalization, ...localizationProp }
    const { data: activeOrganization } = useActiveOrganization()

    if (!activeOrganization) {
        return (
            <SettingsCard
                className={className}
                classNames={classNames}
                description={localization.ORGANIZATION_SLUG_DESCRIPTION}
                instructions={localization.ORGANIZATION_SLUG_INSTRUCTIONS}
                isPending
                title={localization.ORGANIZATION_SLUG}
                actionLabel={localization.SAVE}
                optimistic={props.optimistic}
                {...props}
            >
                <CardContent className={classNames?.content}>
                    <Skeleton
                        className={cn("h-9 w-full", classNames?.skeleton)}
                    />
                </CardContent>
            </SettingsCard>
        )
    }

    return (
        <OrganizationSlugForm
            className={className}
            classNames={classNames}
            localization={localization}
            {...props}
        />
    )
}

const formSchema = z.object({
    slug: z
        .string()
        .min(1, { message: "Organization slug is required" })
        .regex(/^[a-z0-9-]+$/, { message: "Organization slug contains invalid characters" })
})

function OrganizationSlugForm({
    className,
    classNames,
    localization: localizationProp,
    ...props
}: SettingsCardProps) {
    const {
        authClient,
        localization: contextLocalization,
        hooks: {
            useActiveOrganization,
            useListOrganizations,
            useHasPermission
        },
        optimistic,
        toast
    } = useContext(AuthUIContext)

    const localization = { ...contextLocalization, ...localizationProp }

    const { data: activeOrganization, refetch: refetchActiveOrganization } =
        useActiveOrganization()
    const { refetch: refetchOrganizations } = useListOrganizations()
    const { data: hasPermission, isPending } = useHasPermission({
        permissions: {
            organization: ["update"]
        }
    })

    const form = useAppForm({
        defaultValues: {
            slug: activeOrganization?.slug || ""
        },
        validators: {
            onChange: ({ value }) => {
                const result = formSchema.safeParse(value)
                if (!result.success) {
                    return result.error.issues[0]?.message
                }
                return undefined
            }
        },
        onSubmit: async ({ value }) => {
            if (!activeOrganization) return

            if (activeOrganization.slug === value.slug) {
                toast({
                    variant: "error",
                    message: `${localization.ORGANIZATION_SLUG} ${localization.IS_THE_SAME}`
                })
                return
            }

            try {
                await authClient.organization.update({
                    data: { slug: value.slug },
                    fetchOptions: {
                        throw: true
                    }
                })

                await refetchActiveOrganization?.()
                await refetchOrganizations?.()

                toast({
                    variant: "success",
                    message: `${localization.ORGANIZATION_SLUG} ${localization.UPDATED_SUCCESSFULLY}`
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
                    description={localization.ORGANIZATION_SLUG_DESCRIPTION}
                    instructions={localization.ORGANIZATION_SLUG_INSTRUCTIONS}
                    isPending={isPending}
                    title={localization.ORGANIZATION_SLUG}
                    actionLabel={localization.SAVE}
                    optimistic={optimistic}
                    disabled={!hasPermission?.success}
                    {...props}
                >
                    <CardContent className={classNames?.content}>
                        {isPending ? (
                            <Skeleton
                                className={cn(
                                    "h-9 w-full",
                                    classNames?.skeleton
                                )}
                            />
                        ) : (
                            <form.AppField
                                name="slug"
                                children={(field) => (
                                    <field.FormItem>
                                        <field.FormControl>
                                            <Input
                                                className={classNames?.input}
                                                placeholder={
                                                    localization.ORGANIZATION_SLUG_PLACEHOLDER
                                                }
                                                disabled={
                                                    isSubmitting ||
                                                    !hasPermission?.success
                                                }
                                                value={field.state.value}
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
