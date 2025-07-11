"use client";

import { t } from "@lingui/core/macro";
import { use, useState } from "react";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import type { SettingsCardClassNames } from "../shared/settings-card";
import { SettingsCard } from "../shared/settings-card";
import { DeleteAccountDialog } from "./delete-account-dialog";

export interface DeleteAccountCardProperties {
    accounts?: { provider: string }[] | null;
    className?: string;
    classNames?: SettingsCardClassNames;
    isPending?: boolean;

    skipHook?: boolean;
}

export const DeleteAccountCard = ({ accounts, className, classNames, isPending, skipHook }: DeleteAccountCardProperties) => {
    const {
        hooks: { useListAccounts },
    } = useAuth();

    const [showDialog, setShowDialog] = useState(false);

    if (!skipHook) {
        const result = useListAccounts();

        accounts = result.data;
        isPending = result.isPending;
    }

    return (
        <div>
            <SettingsCard
                action={() => setShowDialog(true)}
                actionLabel={t`Delete Account`}
                className={className}
                classNames={classNames}
                description={t`Permanently delete your account and all associated data`}
                isPending={isPending}
                title={t`Delete Account`}
                variant="destructive"
            />

            <DeleteAccountDialog accounts={accounts} classNames={classNames} onOpenChange={setShowDialog} open={showDialog} />
        </div>
    );
};
