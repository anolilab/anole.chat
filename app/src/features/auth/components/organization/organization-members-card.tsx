"use client";

import { useContext, useEffect, useState } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { SettingsCard } from "../settings/shared/settings-card";
import type { SettingsCardProps } from "../settings/shared/settings-card";
import { CardContent } from "@/components/ui/card";
import { InviteMemberDialog } from "./invite-member-dialog";
import { MemberCell } from "./member-cell";

export function OrganizationMembersCard({ className, classNames, ...props }: SettingsCardProps) {
    const {
        basePath,
        hooks: { useActiveOrganization },
        settings,
        replace,
        viewPaths,
    } = useContext(AuthUIContext);

    const { data: activeOrganization, isPending: organizationPending, isRefetching: organizationFetching } = useActiveOrganization();

    useEffect(() => {
        if (organizationPending || organizationFetching) return;
        if (!activeOrganization) replace(`${settings?.basePath || basePath}/${viewPaths.SETTINGS}`);
    }, [activeOrganization, organizationPending, organizationFetching, basePath, settings?.basePath, replace, viewPaths]);

    if (!activeOrganization) {
        return (
            <SettingsCard
                className={className}
                classNames={classNames}
                title={t`Members`}
                description={t`Manage organization members and their roles`}
                instructions={t`Invite new members and update existing member roles`}
                actionLabel={t`Invite Member`}
                isPending
                {...props}
            />
        );
    }

    return <OrganizationMembersContent className={className} classNames={classNames} {...props} />;
}

function OrganizationMembersContent({ className, classNames, ...props }: SettingsCardProps) {
    const {
        hooks: { useActiveOrganization, useHasPermission },
    } = useContext(AuthUIContext);

    const { data: activeOrganization } = useActiveOrganization();
    const { data: hasPermissionInvite, isPending: isPendingInvite } = useHasPermission({
        permissions: {
            invitation: ["create"],
        },
    });

    const { data: hasPermissionUpdateMember, isPending: isPendingUpdateMember } = useHasPermission({
        permission: {
            member: ["update"],
        },
    });

    const isPending = isPendingInvite || isPendingUpdateMember;

    const members = activeOrganization?.members;

    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

    return (
        <>
            <SettingsCard
                className={className}
                classNames={classNames}
                title={t`Members`}
                description={t`Manage organization members and their roles`}
                instructions={t`Invite new members and update existing member roles`}
                actionLabel={t`Invite Member`}
                action={() => setInviteDialogOpen(true)}
                isPending={isPending}
                disabled={!hasPermissionInvite?.success}
                {...props}
            >
                {!isPending && members && members.length > 0 && (
                    <CardContent className={cn("grid gap-4", classNames?.content)}>
                        {members
                            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                            .map((member) => (
                                <MemberCell key={member.id} classNames={classNames} member={member} hideActions={!hasPermissionUpdateMember?.success} />
                            ))}
                    </CardContent>
                )}
            </SettingsCard>

            <InviteMemberDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} classNames={classNames} />
        </>
    );
}
