"use client";

import { PlusIcon } from "lucide-react";
import { type ComponentProps, useMemo, useState } from "react";
import { t } from "@lingui/core/macro";

import { APIKeyDisplayDialog } from "./api-key-display-dialog";
import { CreateAPIKeyDialog } from "./create-api-key-dialog";
import { APIKeyCell } from "./api-key-cell";
import { useListApiKeys } from "../../../hooks/api-key/use-list-api-keys";
import { SettingsCard } from "../shared/settings-card";
import { Button } from "@/components/ui/button";

export interface APIKeysCardProps extends ComponentProps<typeof SettingsCard> {}

export function APIKeysCard({ ...props }: APIKeysCardProps) {
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
                footer={
                    <Button variant="outline" onClick={() => setShowCreateDialog(true)} className="w-fit">
                        <PlusIcon />
                        {t`Create API Key`}
                    </Button>
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
                onAPIKeyCreated={(apiKey) => {
                    setDisplayAPIKey(apiKey);
                    setShowCreateDialog(false);
                }}
            />

            <APIKeyDisplayDialog open={Boolean(displayAPIKey)} onOpenChange={(open) => !open && setDisplayAPIKey(null)} apiKey={displayAPIKey || ""} />
        </>
    );
}
