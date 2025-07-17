"use client";

import { Button } from "@anole/ui/components/button";
import { Card } from "@anole/ui/components/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@anole/ui/components/dropdown-menu";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import type { Organization } from "better-auth/plugins/organization";
import { EllipsisIcon, Loader2, LogOutIcon, SettingsIcon } from "lucide-react";
import { use, useCallback, useState } from "react";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import { getLocalizedError } from "../../lib/utils";
import type { SettingsCardClassNames } from "../settings/shared/settings-card";
import { LeaveOrganizationDialog } from "./leave-organization-dialog";
import { OrganizationView } from "./organization-view";

export interface OrganizationCellProperties {
    className?: string;
    classNames?: SettingsCardClassNames;
    organization: Organization;
}

export const OrganizationCell = ({ className, classNames, organization }: OrganizationCellProperties) => {
    const {
        authClient,
        basePath,
        hooks: { useActiveOrganization },
        navigate,
        settings,
        toast,
        viewPaths,
    } = useAuth();
    const { t } = useLingui();

    const { data: activeOrganization, refetch: refetchActiveOrganization } = useActiveOrganization();
    const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
    const [isManagingOrganization, setIsManagingOrganization] = useState(false);

    const handleManageOrganization = useCallback(async () => {
        if (activeOrganization?.id === organization.id) {
            navigate(`${settings?.basePath || basePath}/${viewPaths.ORGANIZATION}`);

            return;
        }

        setIsManagingOrganization(true);

        try {
            await authClient.organization.setActive({
                fetchOptions: {
                    throw: true,
                },
                organizationId: organization.id,
            });

            await refetchActiveOrganization?.();

            navigate(`${settings?.basePath || basePath}/${viewPaths.ORGANIZATION}`);
        } catch (error) {
            toast({
                message: getLocalizedError({ error, t }),
                variant: "error",
            });
        } finally {
            setIsManagingOrganization(false);
        }
    }, [activeOrganization, authClient, organization.id, basePath, settings?.basePath, viewPaths, navigate, toast, refetchActiveOrganization]);

    return (
        <>
            <Card className={cn("flex-row p-4", className, classNames?.cell)}>
                <OrganizationView organization={organization} />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            className={cn("relative ms-auto", classNames?.button, classNames?.outlineButton)}
                            disabled={isManagingOrganization}
                            size="icon"
                            type="button"
                            variant="outline"
                        >
                            {isManagingOrganization ? <Loader2 className="animate-spin" /> : <EllipsisIcon className={classNames?.icon} />}
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent>
                        <DropdownMenuItem disabled={isManagingOrganization} onClick={handleManageOrganization}>
                            <SettingsIcon className={classNames?.icon} />

                            {t`Manage Organization`}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => {
                                setIsLeaveDialogOpen(true);
                            }}
                            variant="destructive"
                        >
                            <LogOutIcon className={classNames?.icon} />

                            {t`Leave Organization`}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </Card>

            <LeaveOrganizationDialog onOpenChange={setIsLeaveDialogOpen} open={isLeaveDialogOpen} organization={organization} />
        </>
    );
};
