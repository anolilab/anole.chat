"use client";

import { t } from "@lingui/core/macro";
import type { User } from "better-auth";
import type { Member } from "better-auth/plugins/organization";
import { EllipsisIcon, UserCogIcon, UserXIcon } from "lucide-react";
import { use, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import type { SettingsCardClassNames } from "../settings/shared/settings-card";
import { UserView } from "../user-view";
import { RemoveMemberDialog } from "./remove-member-dialog";
import { UpdateMemberRoleDialog } from "./update-member-role-dialog";

export interface MemberCellProperties {
    className?: string;
    classNames?: SettingsCardClassNames;
    hideActions?: boolean;
    member: Member & { user: Partial<User> };
}

export const MemberCell = ({ className, classNames, hideActions, member }: MemberCellProperties) => {
    const {
        hooks: { useActiveOrganization, useSession },
        organization,
    } = useAuth();

    const { data: sessionData } = useSession();
    const { data: activeOrganization } = useActiveOrganization();
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const [updateRoleDialogOpen, setUpdateRoleDialogOpen] = useState(false);

    const builtInRoles = [
        { label: t`Owner`, role: "owner" },
        { label: t`Admin`, role: "admin" },
        { label: t`Member`, role: "member" },
    ];

    const myRole = activeOrganization?.members.find((m) => m.user.id === sessionData?.user.id)?.role;
    const roles = [...builtInRoles, ...organization?.customRoles || []];
    const role = roles.find((r) => r.role === member.role);

    return (
        <>
            <Card className={cn("flex-row items-center p-4", className, classNames?.cell)}>
                <UserView className="flex-1" user={member.user} />
                <span className="text-sm opacity-70">{role?.label}</span>

                {(member.role !== "owner" || myRole === "owner") && !hideActions && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                className={cn("relative ms-auto", classNames?.button, classNames?.outlineButton)}
                                size="icon"
                                type="button"
                                variant="outline"
                            >
                                <EllipsisIcon className={classNames?.icon} />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
                            <DropdownMenuItem onClick={() => setUpdateRoleDialogOpen(true)}>
                                <UserCogIcon className={classNames?.icon} />
                                {t`Update Role`}
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => setRemoveDialogOpen(true)} variant="destructive">
                                <UserXIcon className={classNames?.icon} />
                                {t`Remove Member`}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </Card>

            <RemoveMemberDialog classNames={classNames} member={member} onOpenChange={setRemoveDialogOpen} open={removeDialogOpen} />

            <UpdateMemberRoleDialog classNames={classNames} member={member} onOpenChange={setUpdateRoleDialogOpen} open={updateRoleDialogOpen} />
        </>
    );
};
