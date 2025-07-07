"use client";

import { KeyRoundIcon } from "lucide-react";
import { useContext, useState } from "react";

import { useLang } from "../../../hooks/use-lang";
import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import type { AuthLocalization } from "../../../localization/auth-localization";
import type { ApiKey } from "../../../types/data-structure-types";
import type { Refetch } from "../../../types/hook-integration-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SettingsCardClassNames } from "../shared/settings-card";
import { ApiKeyDeleteDialog } from "./api-key-delete-dialog";

export interface APIKeyCellProps {
    className?: string;
    classNames?: SettingsCardClassNames;
    apiKey: ApiKey;
    localization?: Partial<AuthLocalization>;
    refetch?: Refetch;
}

export function APIKeyCell({ className, classNames, apiKey, localization, refetch }: APIKeyCellProps) {
    const { localization: contextLocalization } = useContext(AuthUIContext);
    localization = { ...contextLocalization, ...localization };

    const { lang } = useLang();

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Format expiration date or show "Never expires"
    const formatExpiration = () => {
        if (!apiKey.expiresAt) return localization.NEVER_EXPIRES;

        const expiresDate = new Date(apiKey.expiresAt);
        return `${localization.EXPIRES} ${expiresDate.toLocaleDateString(lang ?? "en", {
            month: "short",
            day: "numeric",
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
                            {"******"}
                        </span>
                    </div>

                    <div className="text-muted-foreground truncate text-xs">{formatExpiration()}</div>
                </div>

                <Button
                    className={cn("relative ms-auto", classNames?.button, classNames?.outlineButton)}
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDeleteDialog(true)}
                >
                    {localization.DELETE}
                </Button>
            </Card>

            <ApiKeyDeleteDialog
                classNames={classNames}
                apiKey={apiKey}
                localization={localization}
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                refetch={refetch}
            />
        </>
    );
}
