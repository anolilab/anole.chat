"use client";

import { t } from "@lingui/core/macro";
import { Loader2, Trash2Icon, UploadCloudIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { use, useRef, useState } from "react";
import { z } from "zod/v4";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import { fileToBase64, resizeAndCropImage } from "../../lib/image-utils";
import { getLocalizedError } from "../../lib/utils";
import type { SettingsCardClassNames } from "../settings/shared/settings-card";
import { OrganizationLogo } from "./organization-logo";

export interface CreateOrganizationDialogProperties extends ComponentProps<typeof Dialog> {
    className?: string;
    classNames?: SettingsCardClassNames;
}

export const CreateOrganizationDialog = ({ className, classNames, onOpenChange, ...properties }: CreateOrganizationDialogProperties) => {
    const {
        authClient,
        hooks: { useActiveOrganization, useListOrganizations },
        organization,
        toast,
    } = useAuth();

    const [logo, setLogo] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const fileInputReference = useRef<HTMLInputElement>(null);
    const openFileDialog = () => fileInputReference.current?.click();

    const { refetch: refetchActiveOrganization } = useActiveOrganization();
    const { refetch: refetchOrganizations } = useListOrganizations();

    const formSchema = z
        .object({
            logo: z.string().optional(),
            name: z.string().min(1, {
                message: t`Organization name is required`,
            }),
            slug: z
                .string()
                .min(1, {
                    message: t`Organization slug is required`,
                })
                .regex(/^[a-z0-9-]+$/, {
                    message: t`Organization slug is invalid`,
                }),
        })
        .strict();

    const form = useAppForm({
        defaultValues: {
            logo: "",
            name: "",
            slug: "",
        },
        onSubmit: async ({ value }) => {
            try {
                const organization = await authClient.organization.create({
                    fetchOptions: { throw: true },
                    logo: value.logo,
                    name: value.name,
                    slug: value.slug,
                });

                await authClient.organization.setActive({
                    organizationId: organization.id,
                });

                await refetchActiveOrganization?.();
                await refetchOrganizations?.();
                onOpenChange?.(false);
                form.reset();
                setLogo(null);

                toast({
                    message: t`Organization created successfully`,
                    variant: "success",
                });
            } catch (error) {
                toast({
                    message: getLocalizedError({ error }),
                    variant: "error",
                });
            }
        },
        validators: {
            onChange: ({ value }) => formSchema.safeParse(value),
        },
    });

    const handleLogoChange = async (file: File) => {
        if (!organization?.logo)
            return;

        setUploadingLogo(true);

        try {
            const resizedFile = await resizeAndCropImage(file, crypto.randomUUID(), organization.logo.size, organization.logo.extension);

            let image: string | undefined | null;

            image = await (organization?.logo.upload ? organization.logo.upload(resizedFile) : fileToBase64(resizedFile));

            setLogo(image || null);
            form.setFieldValue("logo", image || "");
        } catch (error) {
            toast({
                message: getLocalizedError({ error }),
                variant: "error",
            });
        }

        setUploadingLogo(false);
    };

    const deleteLogo = () => {
        setLogo(null);
        form.setFieldValue("logo", "");
    };

    return (
        <Dialog onOpenChange={onOpenChange} {...properties}>
            <DialogContent className={classNames?.dialog?.content}>
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>{t`Create Organization`}</DialogTitle>

                    <DialogDescription className={cn("text-xs md:text-sm", classNames?.description)}>
                        {t`Create a new organization to collaborate with your team`}
                    </DialogDescription>
                </DialogHeader>

                <form.AppForm>
                    <form
                        className="space-y-6"
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                    >
                        {organization?.logo && (
                            <form.AppField
                                children={() => (
                                    <div className="space-y-2">
                                        <input
                                            accept="image/*"
                                            disabled={uploadingLogo}
                                            hidden
                                            onChange={(e) => {
                                                const file = e.target.files?.item(0);

                                                if (file)
                                                    handleLogoChange(file);

                                                e.target.value = "";
                                            }}
                                            ref={fileInputReference}
                                            type="file"
                                        />

                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {t`Logo`}
                                        </label>

                                        <div className="flex items-center gap-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button className="size-fit rounded-full" size="icon" type="button" variant="ghost">
                                                        <form.Subscribe
                                                            children={(name) => (
                                                                <OrganizationLogo
                                                                    className="size-16"
                                                                    isPending={uploadingLogo}
                                                                    organization={
                                                                        logo
                                                                            ? {
                                                                                logo,
                                                                                name,
                                                                            }
                                                                            : null
                                                                    }
                                                                />
                                                            )}
                                                            selector={(state) => state.values.name}
                                                        />
                                                    </Button>
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent
                                                    align="start"
                                                    onCloseAutoFocus={(e) => {
                                                        e.preventDefault();
                                                    }}
                                                >
                                                    <DropdownMenuItem disabled={uploadingLogo} onClick={openFileDialog}>
                                                        <UploadCloudIcon />
                                                        {t`Upload Logo`}
                                                    </DropdownMenuItem>

                                                    {logo && (
                                                        <DropdownMenuItem disabled={uploadingLogo} onClick={deleteLogo} variant="destructive">
                                                            <Trash2Icon />
                                                            {t`Delete Logo`}
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            <Button disabled={uploadingLogo} onClick={openFileDialog} type="button" variant="outline">
                                                {uploadingLogo && <Loader2 className="animate-spin" />}

                                                {t`Upload`}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                name="logo"
                            />
                        )}

                        <form.AppField
                            children={(field) => (
                                <field.FormItem>
                                    <field.FormLabel>{t`Organization Name`}</field.FormLabel>

                                    <field.FormControl>
                                        <Input
                                            onBlur={field.handleBlur}
                                            onChange={(e) => {
                                                field.handleChange(e.target.value);
                                            }}
                                            placeholder={t`Enter organization name`}
                                            value={field.state.value}
                                        />
                                    </field.FormControl>

                                    <field.FormMessage />
                                </field.FormItem>
                            )}
                            name="name"
                        />

                        <form.AppField
                            children={(field) => (
                                <field.FormItem>
                                    <field.FormLabel>{t`Organization Slug`}</field.FormLabel>

                                    <field.FormControl>
                                        <Input
                                            onBlur={field.handleBlur}
                                            onChange={(e) => {
                                                field.handleChange(e.target.value);
                                            }}
                                            placeholder={t`Enter organization slug`}
                                            value={field.state.value}
                                        />
                                    </field.FormControl>

                                    <field.FormMessage />
                                </field.FormItem>
                            )}
                            name="slug"
                        />

                        <DialogFooter className={classNames?.dialog?.footer}>
                            <Button
                                className={cn(classNames?.button, classNames?.outlineButton)}
                                onClick={() => onOpenChange?.(false)}
                                type="button"
                                variant="outline"
                            >
                                {t`Cancel`}
                            </Button>

                            <form.Subscribe
                                children={([canSubmit, isSubmitting]) => (
                                    <Button className={cn(classNames?.button, classNames?.primaryButton)} disabled={!canSubmit} type="submit">
                                        {isSubmitting && <Loader2 className="animate-spin" />}

                                        {t`Create Organization`}
                                    </Button>
                                )}
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                            />
                        </DialogFooter>
                    </form>
                </form.AppForm>
            </DialogContent>
        </Dialog>
    );
};
