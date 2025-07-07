"use client";

import { useContext } from "react";

import { AuthUIContext } from "../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { SettingsCard } from "../settings/shared/settings-card";
import type { SettingsCardProps } from "../settings/shared/settings-card";
import { CardContent } from "@/components/ui/card";
import { InvitationCell } from "./invitation-cell";

export function OrganizationInvitationsCard({ className, classNames, localization: localizationProp, ...props }: SettingsCardProps) {
    const {
        hooks: { useActiveOrganization },
        localization: contextLocalization,
    } = useContext(AuthUIContext);

    const localization = { ...contextLocalization, ...localizationProp };

    const { data: activeOrganization } = useActiveOrganization();
    const invitations = activeOrganization?.invitations;

    const pendingInvitations = invitations?.filter((invitation) => invitation.status === "pending");

    const isPending = !activeOrganization;

    if (!pendingInvitations?.length) return null;

    return (
        <SettingsCard
            className={className}
            classNames={classNames}
            title={localization.PENDING_INVITATIONS}
            description={localization.PENDING_INVITATIONS_DESCRIPTION}
            isPending={isPending}
            {...props}
        >
            <CardContent className={cn("grid gap-4", classNames?.content)}>
                {pendingInvitations.map((invitation) => (
                    <InvitationCell key={invitation.id} classNames={classNames} invitation={invitation} localization={localization} />
                ))}
            </CardContent>
        </SettingsCard>
    );
}
