"use client";

import { i18n } from "@lingui/core";
import { t } from "@lingui/core/macro";
import { KeyRoundIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEFAULT_LOCALE } from "@/lib/intl/client";
import { cn } from "@/lib/utils";

import type { ApiKey } from "../../../types/data-structure-types";
import type { Refetch } from "../../../types/hook-integration-types";
import type { SettingsCardClassNames } from "../shared/settings-card";
import { ApiKeyDeleteDialog } from "./api-key-delete-dialog";

export interface APIKeyCellProperties {
    apiKey: ApiKey;
    className?: string;
    classNames?: SettingsCardClassNames;

    refetch?: Refetch;
}

export const APIKeyCell = ({ apiKey, className, classNames, refetch }: APIKeyCellProperties) => {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Format expiration date or show "Never expires"
    const formatExpiration = () => {
        if (!apiKey.expiresAt)
            return t`Never expires`;

        const expiresDate = new Date(apiKey.expiresAt);

        return `${t`Expires`} ${expiresDate.toLocaleDateString(i18n.locale ?? DEFAULT_LOCALE, {
            day: "numeric",
            month: "short",
            year: "numeric",
        })}`;
    };

    return (
        <>
            <Card className={cn("flex-row items-center gap-3 truncate px-4 py-3", className, classNames?.cell)}>
                <KeyRoundIcon className={cn("size-4 flex-shrink-0", classNames?.icon)} />

                <div className="flex flex-col truncate">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{apiKey.name}</span>

                        <span className="text-muted-foreground flex-1 truncate text-sm">
                            {apiKey.start}
                            ******
                        </span>
                    </div>

                    <div className="text-muted-foreground truncate text-xs">{formatExpiration()}</div>
                </div>

                <Button
                    className={cn("relative ms-auto", classNames?.button, classNames?.outlineButton)}
                    onClick={() => setShowDeleteDialog(true)}
                    size="sm"
                    variant="outline"
                >
                    {t`Delete`}
                </Button>
            </Card>

            <ApiKeyDeleteDialog apiKey={apiKey} classNames={classNames} onOpenChange={setShowDeleteDialog} open={showDeleteDialog} refetch={refetch} />
        </>
    );
};
