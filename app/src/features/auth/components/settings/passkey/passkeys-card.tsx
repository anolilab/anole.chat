"use client";

import { useContext, useState } from "react";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { getLocalizedError } from "../../../lib/utils";
import { cn } from "@/lib/utils";
import type { AuthLocalization } from "../../../localization/auth-localization";
import { CardContent } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { SessionFreshnessDialog } from "../shared/session-freshness-dialog";
import { SettingsCard } from "../shared/settings-card";
import type { SettingsCardClassNames } from "../shared/settings-card";
import { PasskeyCell } from "./passkey-cell";

export interface PasskeysCardProps {
    className?: string;
    classNames?: SettingsCardClassNames;
    localization?: AuthLocalization;
}

export function PasskeysCard({ className, classNames, localization }: PasskeysCardProps) {
    const {
        authClient,
        freshAge,
        hooks: { useListPasskeys, useSession },
        localization: authLocalization,
        toast,
    } = useContext(AuthUIContext);

    localization = { ...authLocalization, ...localization };

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
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error, localization }),
                });
            }
        },
    });

    return (
        <>
            <SessionFreshnessDialog open={showFreshnessDialog} onOpenChange={setShowFreshnessDialog} classNames={classNames} localization={localization} />

            <form.AppForm>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <SettingsCard
                        className={className}
                        classNames={classNames}
                        actionLabel={localization.ADD_PASSKEY}
                        description={localization.PASSKEYS_DESCRIPTION}
                        instructions={localization.PASSKEYS_INSTRUCTIONS}
                        isPending={isPending}
                        title={localization.PASSKEYS}
                    >
                        {passkeys && passkeys.length > 0 && (
                            <CardContent className={cn("grid gap-4", classNames?.content)}>
                                {passkeys?.map((passkey) => (
                                    <PasskeyCell key={passkey.id} classNames={classNames} localization={localization} passkey={passkey} />
                                ))}
                            </CardContent>
                        )}
                    </SettingsCard>
                </form>
            </form.AppForm>
        </>
    );
}
