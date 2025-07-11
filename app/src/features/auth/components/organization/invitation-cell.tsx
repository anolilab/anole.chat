"use client";

import { t } from "@lingui/core/macro";
import type { Invitation } from "better-auth/plugins/organization";
import { EllipsisIcon, Loader2, XIcon } from "lucide-react";
import { use, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import { getLocalizedError } from "../../lib/utils";
import type { SettingsCardClassNames } from "../settings/shared/settings-card";

export interface InvitationCellProperties {
    className?: string;
    classNames?: SettingsCardClassNames;
    invitation: Invitation;
}

export const InvitationCell = ({ className, classNames, invitation }: InvitationCellProperties) => {
    const {
        authClient,
        hooks: { useActiveOrganization },
        organization,
        toast,
    } = useAuth();

    const [isLoading, setIsLoading] = useState(false);

    const { refetch } = useActiveOrganization();

    const builtInRoles = [
        { label: t`Owner`, role: "owner" },
        { label: t`Admin`, role: "admin" },
        { label: t`Member`, role: "member" },
    ];

    const roles = [...builtInRoles, ...organization?.customRoles || []];
    const role = roles.find((r) => r.role === invitation.role);

    const handleCancelInvitation = async () => {
        setIsLoading(true);

        try {
            await authClient.organization.cancelInvitation({
                fetchOptions: { throw: true },
                invitationId: invitation.id,
            });

            await refetch?.();

            toast({
                message: t`Invitation cancelled`,
                variant: "success",
            });
        } catch (error) {
            toast({
                message: getLocalizedError({ error }),
                variant: "error",
            });
        }

        setIsLoading(false);
    };

    return (
        <Card className={cn("flex-row items-center p-4", className, classNames?.cell)}>
            <div className="flex flex-1 items-center gap-2">
                <Avatar className="my-0.5 h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{invitation.email?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-semibold">{invitation.email}</span>

                    <span className="text-muted-foreground truncate text-xs">
                        {t`Expires`}
                        {" "}
                        {invitation.expiresAt.toLocaleDateString()}
                    </span>
                </div>
            </div>

            <span className="truncate text-sm opacity-70">{role?.label}</span>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        className={cn("relative ms-auto", classNames?.button, classNames?.outlineButton)}
                        disabled={isLoading}
                        size="icon"
                        type="button"
                        variant="outline"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <EllipsisIcon className={classNames?.icon} />}
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent onCloseAutoFocus={(e) => { e.preventDefault(); }}>
                    <DropdownMenuItem disabled={isLoading} onClick={handleCancelInvitation} variant="destructive">
                        <XIcon className={classNames?.icon} />
                        {t`Cancel Invitation`}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </Card>
    );
};
