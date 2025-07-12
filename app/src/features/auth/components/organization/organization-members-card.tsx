"use client";

import { t } from "@lingui/core/macro";
import { use, useEffect, useState } from "react";

import { CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import type { SettingsCardProperties } from "../settings/shared/settings-card";
import { SettingsCard } from "../settings/shared/settings-card";
import { InviteMemberDialog } from "./invite-member-dialog";
import { MemberCell } from "./member-cell";

export const OrganizationMembersCard = ({ className, classNames, ...properties }: SettingsCardProperties) => {
    const {
        basePath,
        hooks: { useActiveOrganization },
        replace,
        settings,
        viewPaths,
    } = useAuth();

    const { data: activeOrganization, isPending: organizationPending, isRefetching: organizationFetching } = useActiveOrganization();

    useEffect(() => {
        if (organizationPending || organizationFetching)
            return;

        if (!activeOrganization)
            replace(`${settings?.basePath || basePath}/${viewPaths.SETTINGS}`);
    }, [activeOrganization, organizationPending, organizationFetching, basePath, settings?.basePath, replace, viewPaths]);

    if (!activeOrganization) {
        return (
            <SettingsCard
                actionLabel={t`Invite Member`}
                className={className}
                classNames={classNames}
                description={t`Manage organization members and their roles`}
                instructions={t`Invite new members and update existing member roles`}
                isPending
                title={t`Members`}
                {...properties}
            />
        );
    }

    return <OrganizationMembersContent className={className} classNames={classNames} {...properties} />;
};

const OrganizationMembersContent = ({ className, classNames, ...properties }: SettingsCardProperties) => {
    const {
        hooks: { useActiveOrganization, useHasPermission },
    } = useAuth();

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
                action={() => {
                    setInviteDialogOpen(true);
                }}
                actionLabel={t`Invite Member`}
                className={className}
                classNames={classNames}
                description={t`Manage organization members and their roles`}
                disabled={!hasPermissionInvite?.success}
                instructions={t`Invite new members and update existing member roles`}
                isPending={isPending}
                title={t`Members`}
                {...properties}
            >
                {!isPending && members && members.length > 0 && (
                    <CardContent className={cn("grid gap-4", classNames?.content)}>
                        {members
                            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                            .map((member) => (
                                <MemberCell classNames={classNames} hideActions={!hasPermissionUpdateMember?.success} key={member.id} member={member} />
                            ))}
                    </CardContent>
                )}
            </SettingsCard>

            <InviteMemberDialog classNames={classNames} onOpenChange={setInviteDialogOpen} open={inviteDialogOpen} />
        </>
    );
};
