"use client";
import { useContext, useState } from "react";
import { t } from "@lingui/core/macro";

import { useIsHydrated } from "../../../../hooks/use-hydrated";
import { AuthUIContext } from "../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { SettingsCard } from "../settings/shared/settings-card";
import type { SettingsCardProps } from "../settings/shared/settings-card";
import { CardContent } from "@/components/ui/card";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { OrganizationCell } from "./organization-cell";

export function OrganizationsCard({ className, classNames, ...props }: SettingsCardProps) {
    const {
        hooks: { useListOrganizations },
    } = useContext(AuthUIContext);

    const isHydrated = useIsHydrated();
    const { data: organizations, isPending: organizationsPending } = useListOrganizations();

    const isPending = !isHydrated || organizationsPending;

    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    return (
        <>
            <SettingsCard
                className={className}
                classNames={classNames}
                title={t`Organizations`}
                description={t`Manage your organizations and memberships`}
                instructions={t`Create new organizations or manage existing ones`}
                actionLabel={t`Create Organization`}
                action={() => setCreateDialogOpen(true)}
                isPending={isPending}
                {...props}
            >
                {organizations && organizations?.length > 0 && (
                    <CardContent className={cn("grid gap-4", classNames?.content)}>
                        {organizations?.map((organization) => (
                            <OrganizationCell key={organization.id} classNames={classNames} organization={organization} />
                        ))}
                    </CardContent>
                )}
            </SettingsCard>

            <CreateOrganizationDialog classNames={classNames} open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
        </>
    );
}
