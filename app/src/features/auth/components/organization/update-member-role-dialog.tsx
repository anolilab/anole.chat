"use client";

import type { User } from "better-auth";
import type { Member } from "better-auth/plugins/organization";
import { Loader2 } from "lucide-react";
import { type ComponentProps, useContext, useState } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { getLocalizedError } from "../../lib/utils";
import type { SettingsCardClassNames } from "../settings/shared/settings-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MemberCell } from "./member-cell";

export interface UpdateMemberRoleDialogProps extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames;
    member: Member & { user: Partial<User> };
}

export function UpdateMemberRoleDialog({ member, classNames, onOpenChange, ...props }: UpdateMemberRoleDialogProps) {
    const {
        authClient,
        hooks: { useActiveOrganization, useSession },
        organization,
        toast,
    } = useContext(AuthUIContext);

    const { refetch } = useActiveOrganization();
    const { data: sessionData } = useSession();
    const { data: activeOrganization } = useActiveOrganization();

    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedRole, setSelectedRole] = useState(member.role);

    const builtInRoles = [
        { role: "owner", label: t`Owner` },
        { role: "admin", label: t`Admin` },
        { role: "member", label: t`Member` },
    ];

    const roles = [...builtInRoles, ...(organization?.customRoles || [])];

    const currentUserRole = activeOrganization?.members.find((m) => m.user.id === sessionData?.user.id)?.role;

    const availableRoles = roles.filter((role) => {
        if (role.role === "owner") {
            return currentUserRole === "owner";
        }

        if (role.role === "admin") {
            return currentUserRole === "owner" || currentUserRole === "admin";
        }

        return true;
    });

    const updateMemberRole = async () => {
        if (selectedRole === member.role) {
            toast({
                variant: "error",
                message: t`Role is the same`,
            });

            return;
        }

        setIsUpdating(true);

        try {
            await authClient.organization.updateMemberRole({
                memberId: member.id,
                // @ts-ignore - role is a string but the type expects specific values
                role: selectedRole,
                organizationId: member.organizationId,
                fetchOptions: {
                    throw: true,
                },
            });

            toast({
                variant: "success",
                message: t`Member role updated`,
            });

            await refetch?.();
            onOpenChange?.(false);
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error }),
            });
        }

        setIsUpdating(false);
    };

    return (
        <Dialog onOpenChange={onOpenChange} {...props}>
            <DialogContent className={classNames?.dialog?.content} onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>{t`Update Role`}</DialogTitle>

                    <DialogDescription className={cn("text-xs md:text-sm", classNames?.description)}>{t`Update the role for this member`}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <MemberCell className={classNames?.cell} member={member} hideActions />

                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={t`Select role`} />
                        </SelectTrigger>

                        <SelectContent>
                            {availableRoles.map((role) => (
                                <SelectItem key={role.role} value={role.role}>
                                    {role.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <DialogFooter className={classNames?.dialog?.footer}>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange?.(false)}
                        className={cn(classNames?.button, classNames?.outlineButton)}
                        disabled={isUpdating}
                    >
                        {t`Cancel`}
                    </Button>

                    <Button type="button" onClick={updateMemberRole} className={cn(classNames?.button, classNames?.primaryButton)} disabled={isUpdating}>
                        {isUpdating && <Loader2 className="animate-spin" />}

                        {t`Update Role`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
