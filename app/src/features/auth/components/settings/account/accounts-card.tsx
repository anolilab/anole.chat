"use client";

import { t } from "@lingui/core/macro";
import { use } from "react";

import { CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import type { SettingsCardClassNames } from "../shared/settings-card";
import { SettingsCard } from "../shared/settings-card";
import { AccountCell } from "./account-cell";

export interface AccountsCardProperties {
    className?: string;
    classNames?: SettingsCardClassNames;
}

export const AccountsCard = ({ className, classNames }: AccountsCardProperties) => {
    const {
        basePath,
        hooks: { useListDeviceSessions },
        navigate,
        viewPaths,
    } = useAuth();

    const { data: deviceSessions, isPending, refetch } = useListDeviceSessions();

    return (
        <SettingsCard
            action={() => navigate(`${basePath}/${viewPaths.SIGN_IN}`)}
            actionLabel={t`Add Account`}
            className={className}
            classNames={classNames}
            description={t`Manage your connected accounts`}
            instructions={t`View and manage all your active sessions`}
            isPending={isPending}
            title={t`Accounts`}
        >
            {deviceSessions?.length && (
                <CardContent className={cn("grid gap-4", classNames?.content)}>
                    {deviceSessions?.map((deviceSession) => (
                        <AccountCell classNames={classNames} deviceSession={deviceSession} key={deviceSession.session.id} refetch={refetch} />
                    ))}
                </CardContent>
            )}
        </SettingsCard>
    );
};
