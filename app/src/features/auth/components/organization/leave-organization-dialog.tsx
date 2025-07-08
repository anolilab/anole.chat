"use client";

import type { Organization } from "better-auth/plugins/organization";
import { Loader2 } from "lucide-react";
import { type ComponentProps, useContext, useState } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { getLocalizedError } from "../../lib/utils";
import type { SettingsCardClassNames } from "../settings/shared/settings-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrganizationView } from "./organization-view";

export interface LeaveOrganizationDialogProps extends ComponentProps<typeof Dialog> {
    className?: string;
    classNames?: SettingsCardClassNames;
    organization: Organization;
}

export function LeaveOrganizationDialog({ organization, className, classNames, onOpenChange, ...props }: LeaveOrganizationDialogProps) {
    const {
        authClient,
        hooks: { useActiveOrganization, useListOrganizations },
        toast,
    } = useContext(AuthUIContext);

    const { data: activeOrganization, refetch: refetchActiveOrganization } = useActiveOrganization();
    const { refetch: refetchOrganizations } = useListOrganizations();

    const [isLeaving, setIsLeaving] = useState(false);

    const handleLeaveOrganization = async () => {
        setIsLeaving(true);

        try {
            await authClient.organization.leave({
                organizationId: organization.id,
                fetchOptions: {
                    throw: true,
                },
            });

            toast({
                variant: "success",
                message: t`Left organization successfully`,
            });

            if (activeOrganization?.id === organization.id) {
                refetchActiveOrganization?.();
            }

            await refetchOrganizations?.();

            onOpenChange?.(false);
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error }),
            });
        }

        setIsLeaving(false);
    };

    return (
        <Dialog onOpenChange={onOpenChange} {...props}>
            <DialogContent className={classNames?.dialog?.content} onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>{t`Leave Organization`}</DialogTitle>

                    <DialogDescription className={cn("text-xs md:text-sm", classNames?.description)}>
                        {t`Are you sure you want to leave this organization?`}
                    </DialogDescription>
                </DialogHeader>

                <Card className={cn("my-2 flex-row p-4", className, classNames?.cell)}>
                    <OrganizationView organization={organization} />
                </Card>

                <DialogFooter className={classNames?.dialog?.footer}>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange?.(false)}
                        className={cn(classNames?.button, classNames?.outlineButton)}
                        disabled={isLeaving}
                    >
                        {t`Cancel`}
                    </Button>

                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleLeaveOrganization}
                        className={cn(classNames?.button, classNames?.destructiveButton)}
                        disabled={isLeaving}
                    >
                        {isLeaving && <Loader2 className="animate-spin" />}

                        {t`Leave Organization`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
