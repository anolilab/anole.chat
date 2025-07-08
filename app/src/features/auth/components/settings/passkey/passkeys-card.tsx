"use client";

import { useContext, useState } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { CardContent } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { SessionFreshnessDialog } from "../shared/session-freshness-dialog";
import { SettingsCard } from "../shared/settings-card";
import type { SettingsCardClassNames } from "../shared/settings-card";
import { PasskeyCell } from "./passkey-cell";

export interface PasskeysCardProps {
    className?: string;
    classNames?: SettingsCardClassNames;
}

export function PasskeysCard({ className, classNames }: PasskeysCardProps) {
    const {
        authClient,
        freshAge,
        hooks: { useListPasskeys, useSession },
        toast,
    } = useContext(AuthUIContext);

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
                    message: t`Failed to add passkey`,
                });
            }
        },
    });

    return (
        <>
            <SessionFreshnessDialog 
                open={showFreshnessDialog} 
                onOpenChange={setShowFreshnessDialog} 
                classNames={classNames} 
            />

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
                        actionLabel={t`Add Passkey`}
                        description={t`Passkeys allow you to sign in securely using your device's biometric authentication or security key.`}
                        instructions={t`Click the button below to register a new passkey with your device.`}
                        isPending={isPending}
                        title={t`Passkeys`}
                    >
                        {passkeys && passkeys.length > 0 && (
                            <CardContent className={cn("grid gap-4", classNames?.content)}>
                                {passkeys?.map((passkey) => (
                                    <PasskeyCell 
                                        key={passkey.id} 
                                        classNames={classNames} 
                                        passkey={passkey} 
                                    />
                                ))}
                            </CardContent>
                        )}
                    </SettingsCard>
                </form>
            </form.AppForm>
        </>
    );
}
