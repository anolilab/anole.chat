"use client";

import { CardContent } from "@anole/ui/components/card";
import { useAppForm } from "@anole/ui/components/form";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { use, useState } from "react";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import { SessionFreshnessDialog } from "../shared/session-freshness-dialog";
import type { SettingsCardClassNames } from "../shared/settings-card";
import { SettingsCard } from "../shared/settings-card";
import { PasskeyCell } from "./passkey-cell";

export interface PasskeysCardProperties {
    className?: string;
    classNames?: SettingsCardClassNames;
}

export const PasskeysCard = ({ className, classNames }: PasskeysCardProperties) => {
    const {
        authClient,
        freshAge,
        hooks: { useListPasskeys, useSession },
        toast,
    } = useAuth();
    const { t } = useLingui();

    const { data: passkeys, isPending, refetch } = useListPasskeys();

    const { data: sessionData } = useSession();
    const session = sessionData?.session;
    const isFresh = session ? Date.now() - session?.createdAt.getTime() < freshAge * 1000 : false;

    const [showFreshnessDialog, setShowFreshnessDialog] = useState(false);

    const form = useAppForm({
        defaultValues: {},
        onSubmit: async () => {
            // If session isn't fresh, show the freshness dialog
            if (!isFresh) {
                setShowFreshnessDialog(true);

                return;
            }

            try {
                await authClient.passkey.addPasskey({
                    fetchOptions: { throw: true },
                });
                await refetch?.();
            } catch {
                toast({
                    message: t`Failed to add passkey`,
                    variant: "error",
                });
            }
        },
    });

    return (
        <>
            <SessionFreshnessDialog classNames={classNames} onOpenChange={setShowFreshnessDialog} open={showFreshnessDialog} />

            <form.AppForm>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <SettingsCard
                        actionLabel={t`Add Passkey`}
                        className={className}
                        classNames={classNames}
                        description={t`Passkeys allow you to sign in securely using your device's biometric authentication or security key.`}
                        instructions={t`Click the button below to register a new passkey with your device.`}
                        isPending={isPending}
                        title={t`Passkeys`}
                    >
                        {passkeys && passkeys.length > 0 && (
                            <CardContent className={cn("grid gap-4", classNames?.content)}>
                                {passkeys?.map((passkey) => (
                                    <PasskeyCell classNames={classNames} key={passkey.id} passkey={passkey} />
                                ))}
                            </CardContent>
                        )}
                    </SettingsCard>
                </form>
            </form.AppForm>
        </>
    );
};
