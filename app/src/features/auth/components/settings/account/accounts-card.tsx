"use client";
import { useContext } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { CardContent } from "@/components/ui/card";
import { SettingsCard } from "../shared/settings-card";
import type { SettingsCardClassNames } from "../shared/settings-card";
import { AccountCell } from "./account-cell";

export interface AccountsCardProps {
    className?: string;
    classNames?: SettingsCardClassNames;
}

export function AccountsCard({ className, classNames }: AccountsCardProps) {
    const {
        basePath,
        hooks: { useListDeviceSessions },
        viewPaths,
        navigate,
    } = useContext(AuthUIContext);

    const { data: deviceSessions, isPending, refetch } = useListDeviceSessions();

    return (
        <SettingsCard
            className={className}
            classNames={classNames}
            title={t`Accounts`}
            description={t`Manage your connected accounts`}
            actionLabel={t`Add Account`}
            instructions={t`View and manage all your active sessions`}
            isPending={isPending}
            action={() => navigate(`${basePath}/${viewPaths.SIGN_IN}`)}
        >
            {deviceSessions?.length && (
                <CardContent className={cn("grid gap-4", classNames?.content)}>
                    {deviceSessions?.map((deviceSession) => (
                        <AccountCell key={deviceSession.session.id} classNames={classNames} deviceSession={deviceSession} refetch={refetch} />
                    ))}
                </CardContent>
            )}
        </SettingsCard>
    );
}
