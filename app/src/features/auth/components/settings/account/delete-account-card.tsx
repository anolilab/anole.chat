"use client";

import { useContext, useState } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { SettingsCard } from "../shared/settings-card";
import type { SettingsCardClassNames } from "../shared/settings-card";
import { DeleteAccountDialog } from "./delete-account-dialog";

export interface DeleteAccountCardProps {
    className?: string;
    classNames?: SettingsCardClassNames;
    accounts?: { provider: string }[] | null;
    isPending?: boolean;

    skipHook?: boolean;
}

export function DeleteAccountCard({ className, classNames, accounts, isPending, skipHook }: DeleteAccountCardProps) {
    const {
        hooks: { useListAccounts },
    } = useContext(AuthUIContext);

    const [showDialog, setShowDialog] = useState(false);

    if (!skipHook) {
        const result = useListAccounts();
        accounts = result.data;
        isPending = result.isPending;
    }

    return (
        <div>
            <SettingsCard
                className={className}
                classNames={classNames}
                actionLabel={t`Delete Account`}
                description={t`Permanently delete your account and all associated data`}
                isPending={isPending}
                title={t`Delete Account`}
                variant="destructive"
                action={() => setShowDialog(true)}
            />

            <DeleteAccountDialog classNames={classNames} accounts={accounts} open={showDialog} onOpenChange={setShowDialog} />
        </div>
    );
}
