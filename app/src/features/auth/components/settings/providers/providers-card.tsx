"use client";

import { PlusIcon } from "lucide-react";
import { type ComponentProps } from "react";
import { t } from "@lingui/core/macro";

import { ProviderCell } from "./provider-cell";
import { SettingsCard } from "../shared/settings-card";
import { Button } from "@/components/ui/button";

interface Provider {
    id: string;
    provider: string;
    email?: string;
    username?: string;
    connectedAt: string;
}

export interface ProvidersCardProps extends ComponentProps<typeof SettingsCard> {
    providers?: Provider[];
    onConnectProvider?: () => void;
    onDisconnectProvider?: (providerId: string) => void;
}

export function ProvidersCard({ providers = [], onConnectProvider, onDisconnectProvider, ...props }: ProvidersCardProps) {
    return (
        <SettingsCard
            {...props}
            header={t`Connected Accounts`}
            description={t`Manage your connected social accounts and third-party providers.`}
            footer={
                <Button variant="outline" onClick={onConnectProvider} className="w-fit">
                    <PlusIcon />
                    {t`Connect Account`}
                </Button>
            }
        >
            {providers.length > 0 ? (
                <div className="space-y-2">
                    {providers.map((provider) => (
                        <ProviderCell key={provider.id} provider={provider} onDisconnect={onDisconnectProvider} />
                    ))}
                </div>
            ) : (
                <div className="text-muted-foreground py-8 text-center text-sm">
                    {t`No connected accounts found. Connect a social account to enable additional sign-in options.`}
                </div>
            )}
        </SettingsCard>
    );
}
