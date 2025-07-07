"use client"

import { Loader2 } from "lucide-react"
import { Trash2Icon, UploadCloudIcon } from "lucide-react"
import { type ComponentProps, useContext, useRef, useState } from "react"
import * as z from "zod"

import { AuthUIContext } from "../../lib/auth-ui-provider"
import { fileToBase64, resizeAndCropImage } from "../../lib/image-utils"
import { cn } from "@/lib/utils"
import { getLocalizedError } from "../../lib/utils"
import type { AuthLocalization } from "../../localization/auth-localization"
import type { SettingsCardClassNames } from "../settings/shared/settings-card"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useAppForm } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { OrganizationLogo } from "./organization-logo"

export interface CreateOrganizationDialogProps
    extends ComponentProps<typeof Dialog> {
    className?: string
    classNames?: SettingsCardClassNames
    localization?: AuthLocalization
}

export function CreateOrganizationDialog({
    className,
    classNames,
    localization: localizationProp,
    onOpenChange,
    ...props
}: CreateOrganizationDialogProps) {
    const {
        authClient,
        hooks: { useActiveOrganization, useListOrganizations },
        localization: contextLocalization,
        organization,
        toast
    } = useContext(AuthUIContext)

    const localization = { ...contextLocalization, ...localizationProp }

    const [logo, setLogo] = useState<string | null>(null)
    const [uploadingLogo, setUploadingLogo] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const openFileDialog = () => fileInputRef.current?.click()

    const { refetch: refetchActiveOrganization } = useActiveOrganization()
    const { refetch: refetchOrganizations } = useListOrganizations()

    const formSchema = z.object({
        logo: z.string().optional(),
        name: z.string().min(1, {
            message: `${localization.ORGANIZATION_NAME} ${localization.IS_REQUIRED}`
        }),
        slug: z
            .string()
            .min(1, {
                message: `${localization.ORGANIZATION_SLUG} ${localization.IS_REQUIRED}`
            })
            .regex(/^[a-z0-9-]+$/, {
                message: `${localization.ORGANIZATION_SLUG} ${localization.IS_INVALID}`
            })
    })

    const form = useAppForm({
        defaultValues: {
            logo: "",
            name: "",
            slug: ""
        },
        validators: {
            onChange: ({ value }) => formSchema.safeParse(value)
        },
        onSubmit: async ({ value }) => {
            try {
                const organization = await authClient.organization.create({
                    name: value.name,
                    slug: value.slug,
                    logo: value.logo,
                    fetchOptions: { throw: true }
                })

                await authClient.organization.setActive({
                    organizationId: organization.id
                })

                await refetchActiveOrganization?.()
                await refetchOrganizations?.()
                onOpenChange?.(false)
                form.reset()
                setLogo(null)

                toast({
                    variant: "success",
                    message: localization.CREATE_ORGANIZATION_SUCCESS
                })
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error, localization })
                })
            }
        }
    })

    const handleLogoChange = async (file: File) => {
        if (!organization?.logo) return

        setUploadingLogo(true)

        try {
            const resizedFile = await resizeAndCropImage(
                file,
                crypto.randomUUID(),
                organization.logo.size,
                organization.logo.extension
            )

            let image: string | undefined | null

            if (organization?.logo.upload) {
                image = await organization.logo.upload(resizedFile)
            } else {
                image = await fileToBase64(resizedFile)
            }

            setLogo(image || null)
            form.setFieldValue("logo", image || "")
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error, localization })
            })
        }

        setUploadingLogo(false)
    }

    const deleteLogo = () => {
        setLogo(null)
        form.setFieldValue("logo", "")
    }

    return (
        <Dialog onOpenChange={onOpenChange} {...props}>
            <DialogContent className={classNames?.dialog?.content}>
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle
                        className={cn("text-lg md:text-xl", classNames?.title)}
                    >
                        {localization.CREATE_ORGANIZATION}
                    </DialogTitle>

                    <DialogDescription
                        className={cn(
                            "text-xs md:text-sm",
                            classNames?.description
                        )}
                    >
                        {localization.ORGANIZATIONS_INSTRUCTIONS}
                    </DialogDescription>
                </DialogHeader>

                <form.AppForm>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            form.handleSubmit()
                        }}
                        className="space-y-6"
                    >
                        {organization?.logo && (
                            <form.AppField
                                name="logo"
                                children={() => (
                                    <div className="space-y-2">
                                        <input
                                            ref={fileInputRef}
                                            accept="image/*"
                                            disabled={uploadingLogo}
                                            hidden
                                            type="file"
                                            onChange={(e) => {
                                                const file =
                                                    e.target.files?.item(0)
                                                if (file) handleLogoChange(file)
                                                e.target.value = ""
                                            }}
                                        />

                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {localization.LOGO}
                                        </label>

                                        <div className="flex items-center gap-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        className="size-fit rounded-full"
                                                        size="icon"
                                                        type="button"
                                                        variant="ghost"
                                                    >
                                                        <form.Subscribe
                                                            selector={(state) => state.values.name}
                                                            children={(name) => (
                                                                <OrganizationLogo
                                                                    className="size-16"
                                                                    isPending={
                                                                        uploadingLogo
                                                                    }
                                                                    localization={
                                                                        localization
                                                                    }
                                                                    organization={
                                                                        logo
                                                                            ? {
                                                                                name: name,
                                                                                logo
                                                                            }
                                                                            : null
                                                                    }
                                                                />
                                                            )}
                                                        />
                                                    </Button>
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent
                                                    align="start"
                                                    onCloseAutoFocus={(e) =>
                                                        e.preventDefault()
                                                    }
                                                >
                                                    <DropdownMenuItem
                                                        onClick={openFileDialog}
                                                        disabled={uploadingLogo}
                                                    >
                                                        <UploadCloudIcon />
                                                        {
                                                            localization.UPLOAD_LOGO
                                                        }
                                                    </DropdownMenuItem>

                                                    {logo && (
                                                        <DropdownMenuItem
                                                            onClick={deleteLogo}
                                                            disabled={
                                                                uploadingLogo
                                                            }
                                                            variant="destructive"
                                                        >
                                                            <Trash2Icon />
                                                            {
                                                                localization.DELETE_LOGO
                                                            }
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            <Button
                                                disabled={uploadingLogo}
                                                variant="outline"
                                                onClick={openFileDialog}
                                                type="button"
                                            >
                                                {uploadingLogo && (
                                                    <Loader2 className="animate-spin" />
                                                )}

                                                {localization.UPLOAD}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            />
                        )}

                        <form.AppField
                            name="name"
                            children={(field) => (
                                <field.FormItem>
                                    <field.FormLabel>
                                        {localization.ORGANIZATION_NAME}
                                    </field.FormLabel>

                                    <field.FormControl>
                                        <Input
                                            placeholder={
                                                localization.ORGANIZATION_NAME_PLACEHOLDER
                                            }
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
                            name="slug"
                            children={(field) => (
                                <field.FormItem>
                                    <field.FormLabel>
                                        {localization.ORGANIZATION_SLUG}
                                    </field.FormLabel>

                                    <field.FormControl>
                                        <Input
                                            placeholder={
                                                localization.ORGANIZATION_SLUG_PLACEHOLDER
                                            }
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                        />
                                    </field.FormControl>

                                    <field.FormMessage />
                                </field.FormItem>
                            )}
                        />

                        <DialogFooter className={classNames?.dialog?.footer}>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange?.(false)}
                                className={cn(
                                    classNames?.button,
                                    classNames?.outlineButton
                                )}
                            >
                                {localization.CANCEL}
                            </Button>

                            <form.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                                children={([canSubmit, isSubmitting]) => (
                                    <Button
                                        type="submit"
                                        className={cn(
                                            classNames?.button,
                                            classNames?.primaryButton
                                        )}
                                        disabled={!canSubmit}
                                    >
                                        {isSubmitting && (
                                            <Loader2 className="animate-spin" />
                                        )}

                                        {localization.CREATE_ORGANIZATION}
                                    </Button>
                                )}
                            />
                        </DialogFooter>
                    </form>
                </form.AppForm>
            </DialogContent>
        </Dialog>
    )
}
