"use client";

import { t } from "@lingui/core/macro";
import { PlusIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { use, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import { SettingsCard } from "../shared/settings-card";
import { APIKeyCell } from "./api-key-cell";
import { APIKeyDisplayDialog } from "./api-key-display-dialog";
import { CreateAPIKeyDialog } from "./create-api-key-dialog";

export interface APIKeysCardProperties extends ComponentProps<typeof SettingsCard> {}

export const APIKeysCard = ({ ...properties }: APIKeysCardProperties) => {
    const {
        hooks: { useListApiKeys },
    } = useAuth();

    const { data: apiKeys } = useListApiKeys();

    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [displayAPIKey, setDisplayAPIKey] = useState<string | null>(null);

    const sortedAPIKeys = useMemo(() => {
        if (!apiKeys)
            return [];

        return [...apiKeys].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [apiKeys]);

    return (
        <>
            <SettingsCard
                {...properties}
                action={() => {
                    setShowCreateDialog(true);
                }}
                description={t`Create and manage API keys for programmatic access to your account.`}
                footer={(
                    <>
                        <PlusIcon />
                        {t`Create API Key`}
                    </>
                )}
                header={t`API Keys`}
            >
                {sortedAPIKeys.length > 0
                    ? (
                        <div className="space-y-2">
                            {sortedAPIKeys.map((apiKey) => (
                                <APIKeyCell apiKey={apiKey} key={apiKey.id} />
                            ))}
                        </div>
                    )
                    : (
                        <div className="text-muted-foreground py-8 text-center text-sm">{t`No API keys found. Create one to get started.`}</div>
                    )}
            </SettingsCard>

            <CreateAPIKeyDialog
                onOpenChange={setShowCreateDialog}
                onSuccess={(apiKey) => {
                    setDisplayAPIKey(apiKey);
                    setShowCreateDialog(false);
                }}
                open={showCreateDialog}
            />

            <APIKeyDisplayDialog apiKey={displayAPIKey || ""} onOpenChange={(open) => !open && setDisplayAPIKey(null)} open={Boolean(displayAPIKey)} />
        </>
    );
};
