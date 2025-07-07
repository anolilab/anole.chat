"use client";

import type { User } from "better-auth";
import type { Member } from "better-auth/plugins/organization";
import { EllipsisIcon, UserCogIcon, UserXIcon } from "lucide-react";
import { useContext, useState } from "react";

import { AuthUIContext } from "../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import type { AuthLocalization } from "../../localization/auth-localization";
import type { SettingsCardClassNames } from "../settings/shared/settings-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserView } from "../user-view";
import { RemoveMemberDialog } from "./remove-member-dialog";
import { UpdateMemberRoleDialog } from "./update-member-role-dialog";

export interface MemberCellProps {
    className?: string;
    classNames?: SettingsCardClassNames;
    member: Member & { user: Partial<User> };
    localization?: AuthLocalization;
    hideActions?: boolean;
}

export function MemberCell({ className, classNames, member, localization: localizationProp, hideActions }: MemberCellProps) {
    const {
        organization,
        hooks: { useActiveOrganization, useSession },
        localization: contextLocalization,
    } = useContext(AuthUIContext);
    const localization = { ...contextLocalization, ...localizationProp };

    const { data: sessionData } = useSession();
    const { data: activeOrganization } = useActiveOrganization();
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const [updateRoleDialogOpen, setUpdateRoleDialogOpen] = useState(false);

    const builtInRoles = [
        { role: "owner", label: localization.OWNER },
        { role: "admin", label: localization.ADMIN },
        { role: "member", label: localization.MEMBER },
    ];

    const myRole = activeOrganization?.members.find((m) => m.user.id === sessionData?.user.id)?.role;
    const roles = [...builtInRoles, ...(organization?.customRoles || [])];
    const role = roles.find((r) => r.role === member.role);

    return (
        <>
            <Card className={cn("flex-row items-center p-4", className, classNames?.cell)}>
                <UserView user={member.user} localization={localization} className="flex-1" />
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
                                {localization?.UPDATE_ROLE}
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => setRemoveDialogOpen(true)} variant="destructive">
                                <UserXIcon className={classNames?.icon} />
                                {localization?.REMOVE_MEMBER}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </Card>

            <RemoveMemberDialog
                open={removeDialogOpen}
                onOpenChange={setRemoveDialogOpen}
                member={member}
                classNames={classNames}
                localization={localization}
            />

            <UpdateMemberRoleDialog
                open={updateRoleDialogOpen}
                onOpenChange={setUpdateRoleDialogOpen}
                member={member}
                classNames={classNames}
                localization={localization}
            />
        </>
    );
}
