"use client";

import { t } from "@lingui/core/macro";
import { use, useState } from "react";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import type { SettingsCardProperties } from "../settings/shared/settings-card";
import { SettingsCard } from "../settings/shared/settings-card";
import { DeleteOrganizationDialog } from "./delete-organization-dialog";

export const DeleteOrganizationCard = ({ className, classNames }: SettingsCardProperties) => {
    const {
        hooks: { useActiveOrganization, useSession },
    } = useAuth();
    const [showDialog, setShowDialog] = useState(false);

    const { data: activeOrganization, isPending: organizationPending } = useActiveOrganization();
    const { data: sessionData, isPending: sessionPending } = useSession();

    const isPending = organizationPending || sessionPending;

    const membership = activeOrganization?.members?.find((member) => member.userId === sessionData?.user.id);
    const isOwner = membership?.role === "owner";

    if (!isPending && !isOwner)
        return null;

    return (
        <>
            <SettingsCard
                action={() => {
                    setShowDialog(true);
                }}
                actionLabel={t`Delete Organization`}
                className={className}
                classNames={classNames}
                description={t`Permanently delete this organization and all its data`}
                isPending={isPending}
                title={t`Delete Organization`}
                variant="destructive"
            />

            <DeleteOrganizationDialog classNames={classNames} onOpenChange={setShowDialog} open={showDialog} />
        </>
    );
};
