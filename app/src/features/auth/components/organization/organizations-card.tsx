"use client";

import { t } from "@lingui/core/macro";
import { use, useState } from "react";

import { CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import { useIsHydrated } from "../../../../hooks/use-hydrated";
import type { SettingsCardProps as SettingsCardProperties } from "../settings/shared/settings-card";
import { SettingsCard } from "../settings/shared/settings-card";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { OrganizationCell } from "./organization-cell";

export const OrganizationsCard = ({ className, classNames, ...properties }: SettingsCardProperties) => {
    const {
        hooks: { useListOrganizations },
    } = useAuth();

    const isHydrated = useIsHydrated();
    const { data: organizations, isPending: organizationsPending } = useListOrganizations();

    const isPending = !isHydrated || organizationsPending;

    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    return (
        <>
            <SettingsCard
                action={() => { setCreateDialogOpen(true); }}
                actionLabel={t`Create Organization`}
                className={className}
                classNames={classNames}
                description={t`Manage your organizations and memberships`}
                instructions={t`Create new organizations or manage existing ones`}
                isPending={isPending}
                title={t`Organizations`}
                {...properties}
            >
                {organizations && organizations?.length > 0 && (
                    <CardContent className={cn("grid gap-4", classNames?.content)}>
                        {organizations?.map((organization) => (
                            <OrganizationCell classNames={classNames} key={organization.id} organization={organization} />
                        ))}
                    </CardContent>
                )}
            </SettingsCard>

            <CreateOrganizationDialog classNames={classNames} onOpenChange={setCreateDialogOpen} open={createDialogOpen} />
        </>
    );
};
