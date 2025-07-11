"use client";

import { t } from "@lingui/core/macro";
import { use } from "react";

import { CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import type { SettingsCardProps as SettingsCardProperties } from "../settings/shared/settings-card";
import { SettingsCard } from "../settings/shared/settings-card";
import { InvitationCell } from "./invitation-cell";

export const OrganizationInvitationsCard = ({ className, classNames, ...properties }: SettingsCardProperties) => {
    const {
        hooks: { useActiveOrganization },
    } = useAuth();

    const { data: activeOrganization } = useActiveOrganization();
    const invitations = activeOrganization?.invitations;

    const pendingInvitations = invitations?.filter((invitation) => invitation.status === "pending");

    const isPending = !activeOrganization;

    if (!pendingInvitations?.length)
        return null;

    return (
        <SettingsCard
            className={className}
            classNames={classNames}
            description={t`Invitations waiting for a response`}
            isPending={isPending}
            title={t`Pending Invitations`}
            {...properties}
        >
            <CardContent className={cn("grid gap-4", classNames?.content)}>
                {pendingInvitations.map((invitation) => (
                    <InvitationCell classNames={classNames} invitation={invitation} key={invitation.id} />
                ))}
            </CardContent>
        </SettingsCard>
    );
};
