"use client";

import type { User } from "better-auth";
import { Loader2 } from "lucide-react";
import { type ComponentProps, useContext, useState } from "react";
import { t } from "@lingui/core/macro";

import type { Member } from "better-auth/plugins/organization";
import { AuthUIContext } from "../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { getLocalizedError } from "../../lib/utils";
import type { SettingsCardClassNames } from "../settings/shared/settings-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MemberCell } from "./member-cell";

export interface RemoveMemberDialogProps extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames;
    member: Member & { user: Partial<User> };
}

export function RemoveMemberDialog({ member, classNames, onOpenChange, ...props }: RemoveMemberDialogProps) {
    const {
        authClient,
        hooks: { useActiveOrganization },
        toast,
        organization,
    } = useContext(AuthUIContext);

    const { refetch } = useActiveOrganization();

    const builtInRoles = [
        { role: "owner", label: t`Owner` },
        { role: "admin", label: t`Admin` },
        { role: "member", label: t`Member` },
    ];

    const roles = [...builtInRoles, ...(organization?.customRoles || [])];
    const role = roles.find((r) => r.role === member.role);

    const [isRemoving, setIsRemoving] = useState(false);

    const removeMember = async () => {
        setIsRemoving(true);

        try {
            await authClient.organization.removeMember({
                memberIdOrEmail: member.id,
                organizationId: member.organizationId,
                fetchOptions: {
                    throw: true,
                },
            });

            toast({
                variant: "success",
                message: t`Member removed successfully`,
            });

            await refetch?.();
            onOpenChange?.(false);
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error }),
            });
        }

        setIsRemoving(false);
    };

    return (
        <Dialog onOpenChange={onOpenChange} {...props}>
            <DialogContent className={classNames?.dialog?.content} onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>{t`Remove Member`}</DialogTitle>

                    <DialogDescription
                        className={cn("text-xs md:text-sm", classNames?.description)}
                    >{t`Are you sure you want to remove this member?`}</DialogDescription>
                </DialogHeader>

                <MemberCell className={classNames?.cell} member={member} hideActions />

                <DialogFooter className={classNames?.dialog?.footer}>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange?.(false)}
                        className={cn(classNames?.button, classNames?.outlineButton)}
                        disabled={isRemoving}
                    >
                        {t`Cancel`}
                    </Button>

                    <Button
                        type="button"
                        variant="destructive"
                        onClick={removeMember}
                        className={cn(classNames?.button, classNames?.destructiveButton)}
                        disabled={isRemoving}
                    >
                        {isRemoving && <Loader2 className="animate-spin" />}
                        {t`Remove Member`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
