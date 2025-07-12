"use client";

import { t } from "@lingui/core/macro";
import { Trash2Icon, UploadCloudIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { use, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import { fileToBase64, resizeAndCropImage } from "../../lib/image-utils";
import { getLocalizedError } from "../../lib/utils";
import type { SettingsCardClassNames } from "../settings/shared/settings-card";
import { SettingsCardFooter } from "../settings/shared/settings-card-footer";
import { SettingsCardHeader } from "../settings/shared/settings-card-header";
import { OrganizationLogo } from "./organization-logo";

export interface OrganizationLogoCardProperties extends ComponentProps<typeof Card> {
    className?: string;
    classNames?: SettingsCardClassNames;
}

export const OrganizationLogoCard = ({ className, classNames, ...properties }: OrganizationLogoCardProperties) => {
    const {
        hooks: { useActiveOrganization },
    } = useAuth();

    const { data: activeOrganization } = useActiveOrganization();

    if (!activeOrganization) {
        return (
            <Card className={cn("w-full pb-0 text-start", className, classNames?.base)} {...properties}>
                <div className="flex justify-between">
                    <SettingsCardHeader
                        className="grow self-start"
                        classNames={classNames}
                        description={t`Upload your organization's logo`}
                        isPending
                        title={t`Logo`}
                    />

                    <Button className="me-6 size-fit rounded-full" disabled size="icon" type="button" variant="ghost">
                        <OrganizationLogo className="size-20 text-2xl" classNames={classNames?.avatar} isPending />
                    </Button>
                </div>

                <SettingsCardFooter
                    className="!py-5"
                    classNames={classNames}
                    instructions={t`Click on the logo to upload a new image`}
                    isPending
                    isSubmitting={false}
                />
            </Card>
        );
    }

    return <OrganizationLogoForm className={className} classNames={classNames} {...properties} />;
};

const OrganizationLogoForm = ({ className, classNames, ...properties }: OrganizationLogoCardProperties) => {
    const {
        authClient,
        hooks: { useActiveOrganization, useHasPermission, useListOrganizations },
        optimistic,
        organization,
        toast,
    } = useAuth();

    const { data: activeOrganization, refetch: refetchActiveOrganization } = useActiveOrganization();
    const { refetch: refetchOrganizations } = useListOrganizations();
    const { data: hasPermission, isPending: permissionPending } = useHasPermission({
        permissions: {
            organization: ["update"],
        },
    });

    const isPending = !activeOrganization || permissionPending;

    const fileInputReference = useRef<HTMLInputElement | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogoChange = async (file: File) => {
        if (!activeOrganization || !organization?.logo || !hasPermission?.success)
            return;

        setLoading(true);
        const resizedFile = await resizeAndCropImage(file, crypto.randomUUID(), organization.logo.size, organization.logo.extension);

        let image: string | undefined | null;

        image = await (organization.logo.upload ? organization.logo.upload(resizedFile) : fileToBase64(resizedFile));

        if (!image) {
            setLoading(false);

            return;
        }

        if (optimistic && !organization.logo.upload)
            setLoading(false);

        try {
            await authClient.organization.update({
                data: { logo: image },
                fetchOptions: { throw: true },
            });

            await refetchActiveOrganization?.();
            await refetchOrganizations?.();
        } catch (error) {
            toast({
                message: getLocalizedError({ error }),
                variant: "error",
            });
        }

        setLoading(false);
    };

    const handleDeleteLogo = async () => {
        if (!activeOrganization || !hasPermission?.success)
            return;

        setLoading(true);

        try {
            await authClient.organization.update({
                data: { logo: "" },
                fetchOptions: { throw: true },
            });

            await refetchActiveOrganization?.();
            await refetchOrganizations?.();
        } catch (error) {
            toast({
                message: getLocalizedError({ error }),
                variant: "error",
            });
        }

        setLoading(false);
    };

    const openFileDialog = () => {
        if (hasPermission?.success) {
            fileInputReference.current?.click();
        }
    };

    return (
        <Card className={cn("w-full pb-0 text-start", className, classNames?.base)} {...properties}>
            <input
                accept="image/*"
                disabled={loading || !hasPermission?.success}
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

            <div className="flex justify-between">
                <SettingsCardHeader
                    className="grow self-start"
                    classNames={classNames}
                    description={t`Upload your organization's logo`}
                    isPending={isPending}
                    title={t`Logo`}
                />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="me-6 size-fit rounded-full" disabled={!hasPermission?.success} size="icon" type="button" variant="ghost">
                            <OrganizationLogo
                                className="size-20 text-2xl"
                                classNames={classNames?.avatar}
                                isPending={isPending || loading}
                                key={activeOrganization?.logo}
                                organization={activeOrganization}
                            />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        onCloseAutoFocus={(e) => {
                            e.preventDefault();
                        }}
                    >
                        <DropdownMenuItem disabled={loading || !hasPermission?.success} onClick={openFileDialog}>
                            <UploadCloudIcon />
                            {t`Upload Logo`}
                        </DropdownMenuItem>
                        {activeOrganization?.logo && (
                            <DropdownMenuItem disabled={loading || !hasPermission?.success} onClick={handleDeleteLogo} variant="destructive">
                                <Trash2Icon />
                                {t`Delete Logo`}
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <SettingsCardFooter
                className="!py-5"
                classNames={classNames}
                instructions={t`Click on the logo to upload a new image`}
                isPending={isPending}
                isSubmitting={loading}
            />
        </Card>
    );
};
