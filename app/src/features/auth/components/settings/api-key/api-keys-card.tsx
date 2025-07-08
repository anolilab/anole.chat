"use client";

import { PlusIcon } from "lucide-react";
import { type ComponentProps, useContext, useMemo, useState } from "react";
import { t } from "@lingui/core/macro";

import { APIKeyDisplayDialog } from "./api-key-display-dialog";
import { CreateAPIKeyDialog } from "./create-api-key-dialog";
import { APIKeyCell } from "./api-key-cell";
import { SettingsCard } from "../shared/settings-card";
import { Button } from "@/components/ui/button";
import { AuthUIContext } from "@/features/auth/lib/auth-ui-provider";

export interface APIKeysCardProps extends ComponentProps<typeof SettingsCard> {}

export function APIKeysCard({ ...props }: APIKeysCardProps) {
    const {
        hooks: { useListApiKeys },
    } = useContext(AuthUIContext);

    const { data: apiKeys } = useListApiKeys();

    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [displayAPIKey, setDisplayAPIKey] = useState<string | null>(null);

    const sortedAPIKeys = useMemo(() => {
        if (!apiKeys) return [];
        return [...apiKeys].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [apiKeys]);

    return (
        <>
            <SettingsCard
                {...props}
                header={t`API Keys`}
                description={t`Create and manage API keys for programmatic access to your account.`}
                action={() => setShowCreateDialog(true)}
                footer={
                    <>
                        <PlusIcon />
                        {t`Create API Key`}
                    </>
                }
            >
                {sortedAPIKeys.length > 0 ? (
                    <div className="space-y-2">
                        {sortedAPIKeys.map((apiKey) => (
                            <APIKeyCell key={apiKey.id} apiKey={apiKey} />
                        ))}
                    </div>
                ) : (
                    <div className="text-muted-foreground py-8 text-center text-sm">{t`No API keys found. Create one to get started.`}</div>
                )}
            </SettingsCard>

            <CreateAPIKeyDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={(apiKey) => {
                    setDisplayAPIKey(apiKey);
                    setShowCreateDialog(false);
                }}
            />

            <APIKeyDisplayDialog open={Boolean(displayAPIKey)} onOpenChange={(open) => !open && setDisplayAPIKey(null)} apiKey={displayAPIKey || ""} />
        </>
    );
}
