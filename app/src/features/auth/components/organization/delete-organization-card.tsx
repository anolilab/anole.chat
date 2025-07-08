"use client";

import { useContext, useState } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../lib/auth-ui-provider";
import { SettingsCard } from "../settings/shared/settings-card";
import type { SettingsCardProps } from "../settings/shared/settings-card";
import { DeleteOrganizationDialog } from "./delete-organization-dialog";

export function DeleteOrganizationCard({ className, classNames }: SettingsCardProps) {
    const {
        hooks: { useActiveOrganization, useSession },
    } = useContext(AuthUIContext);
    const [showDialog, setShowDialog] = useState(false);

    const { data: activeOrganization, isPending: organizationPending } = useActiveOrganization();
    const { data: sessionData, isPending: sessionPending } = useSession();

    const isPending = organizationPending || sessionPending;

    const membership = activeOrganization?.members?.find((member) => member.userId === sessionData?.user.id);
    const isOwner = membership?.role === "owner";

    if (!isPending && !isOwner) return null;

    return (
        <>
            <SettingsCard
                className={className}
                classNames={classNames}
                actionLabel={t`Delete Organization`}
                description={t`Permanently delete this organization and all its data`}
                isPending={isPending}
                title={t`Delete Organization`}
                variant="destructive"
                action={() => setShowDialog(true)}
            />

            <DeleteOrganizationDialog classNames={classNames} open={showDialog} onOpenChange={setShowDialog} />
        </>
    );
}
