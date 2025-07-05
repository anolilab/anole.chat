"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { type ComponentProps, useContext } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { AuthUIContext } from "../../lib/auth-ui-provider"
import { cn } from "@/lib/utils"
import { getLocalizedError } from "../../lib/utils"
import type { AuthLocalization } from "../../localization/auth-localization"
import type { SettingsCardClassNames } from "../settings/shared/settings-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { OrganizationView } from "./organization-view"

export interface DeleteOrganizationDialogProps
    extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames
    localization?: AuthLocalization
}

export function DeleteOrganizationDialog({
    classNames,
    localization,
    onOpenChange,
    ...props
}: DeleteOrganizationDialogProps) {
    const {
        authClient,
        hooks: { useActiveOrganization, useListOrganizations },
        localization: contextLocalization,
        redirectTo,
        navigate,
        toast
    } = useContext(AuthUIContext)

    localization = { ...contextLocalization, ...localization }

    const { data: activeOrganization, refetch: refetchActiveOrganization } =
        useActiveOrganization()
    const { refetch: refetchOrganizations } = useListOrganizations()

    const formSchema = z.object({
        slug: z
            .string()
            .min(1, { message: localization.SLUG_REQUIRED! })
            .refine((val) => val === activeOrganization?.slug, {
                message: localization.SLUG_DOES_NOT_MATCH!
            })
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            slug: ""
        }
    })

    const { isSubmitting } = form.formState

    const deleteOrganization = async () => {
        if (!activeOrganization) return

        try {
            await authClient.organization.delete({
                organizationId: activeOrganization.id,
                fetchOptions: {
                    throw: true
                }
            })

            await refetchOrganizations?.()
            await refetchActiveOrganization?.()

            toast({
                variant: "success",
                message: localization.DELETE_ORGANIZATION_SUCCESS!
            })
            navigate(redirectTo)
            onOpenChange?.(false)
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error, localization })
            })
        }
    }

    return (
        <Dialog onOpenChange={onOpenChange} {...props}>
            <DialogContent
                className={cn("sm:max-w-md", classNames?.dialog?.content)}
            >
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle
                        className={cn("text-lg md:text-xl", classNames?.title)}
                    >
                        {localization?.DELETE_ORGANIZATION}
                    </DialogTitle>

                    <DialogDescription
                        className={cn(
                            "text-xs md:text-sm",
                            classNames?.description
                        )}
                    >
                        {localization?.DELETE_ORGANIZATION_DESCRIPTION}
                    </DialogDescription>
                </DialogHeader>

                <Card className={cn("my-2 flex-row p-4", classNames?.cell)}>
                    <OrganizationView
                        organization={activeOrganization}
                        localization={localization}
                    />
                </Card>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(deleteOrganization)}
                        className="grid gap-6"
                    >
                        <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={classNames?.label}>
                                        {
                                            localization?.DELETE_ORGANIZATION_INSTRUCTIONS
                                        }

                                        <span className="font-bold">
                                            {activeOrganization?.slug}
                                        </span>
                                    </FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder={
                                                activeOrganization?.slug
                                            }
                                            className={classNames?.input}
                                            autoComplete="off"
                                            {...field}
                                        />
                                    </FormControl>

                                    <FormMessage
                                        className={classNames?.error}
                                    />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className={classNames?.dialog?.footer}>
                            <Button
                                type="button"
                                variant="secondary"
                                className={cn(
                                    classNames?.button,
                                    classNames?.secondaryButton
                                )}
                                onClick={() => onOpenChange?.(false)}
                            >
                                {localization.CANCEL}
                            </Button>

                            <Button
                                className={cn(
                                    classNames?.button,
                                    classNames?.destructiveButton
                                )}
                                disabled={isSubmitting}
                                variant="destructive"
                                type="submit"
                            >
                                {isSubmitting && (
                                    <Loader2 className="animate-spin" />
                                )}

                                {localization?.DELETE_ORGANIZATION}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
