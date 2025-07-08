"use client";

import { PlusIcon } from "lucide-react";
import { type ComponentProps } from "react";
import { t } from "@lingui/core/macro";

import { PasskeyCell } from "./passkey-cell";
import { SettingsCard } from "../shared/settings-card";
import { Button } from "@/components/ui/button";

interface PasskeyDevice {
    id: string;
    name: string;
    type: "mobile" | "tablet" | "desktop";
    createdAt: string;
    lastUsed?: string;
}

export interface PasskeysCardProps extends ComponentProps<typeof SettingsCard> {
    passkeys?: PasskeyDevice[];
    onAddPasskey?: () => void;
    onDeletePasskey?: (passkeyId: string) => void;
}

export function PasskeysCard({ passkeys = [], onAddPasskey, onDeletePasskey, ...props }: PasskeysCardProps) {
    return (
        <SettingsCard
            {...props}
            header={t`Passkeys`}
            description={t`Passkeys allow you to sign in securely using your device's biometric authentication or security key.`}
            footer={
                <Button variant="outline" onClick={onAddPasskey} className="w-fit">
                    <PlusIcon />
                    {t`Add Passkey`}
                </Button>
            }
        >
            {passkeys.length > 0 ? (
                <div className="space-y-2">
                    {passkeys.map((passkey) => (
                        <PasskeyCell key={passkey.id} passkey={passkey} onDelete={onDeletePasskey} />
                    ))}
                </div>
            ) : (
                <div className="text-muted-foreground py-8 text-center text-sm">{t`No passkeys found. Add one to enable passwordless sign-in.`}</div>
            )}
        </SettingsCard>
    );
}
