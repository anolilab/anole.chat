"use client";

import { Button } from "@anole/ui/components/button";
import { Card } from "@anole/ui/components/card";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { FingerprintIcon, Loader2 } from "lucide-react";
import { use, useState } from "react";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import { SessionFreshnessDialog } from "../shared/session-freshness-dialog";
import type { SettingsCardClassNames } from "../shared/settings-card";

export interface PasskeyCellProperties {
    className?: string;
    classNames?: SettingsCardClassNames;
    passkey: { createdAt: Date; id: string };
}

export const PasskeyCell = ({ className, classNames, passkey }: PasskeyCellProperties) => {
    const {
        freshAge,
        hooks: { useListPasskeys, useSession },
        mutators: { deletePasskey },
        toast,
    } = useAuth();
    const { t } = useLingui();

    const { refetch } = useListPasskeys();

    const { data: sessionData } = useSession();
    const session = sessionData?.session;
    const isFresh = session ? Date.now() - session?.createdAt.getTime() < freshAge * 1000 : false;

    const [showFreshnessDialog, setShowFreshnessDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleDeletePasskey = async () => {
        // If session isn't fresh, show the freshness dialog
        if (!isFresh) {
            setShowFreshnessDialog(true);

            return;
        }

        setIsLoading(true);

        try {
            await deletePasskey({ id: passkey.id });
            refetch?.();
        } catch {
            setIsLoading(false);

            toast({
                message: t`Failed to delete passkey`,
                variant: "error",
            });
        }
    };

    return (
        <>
            <SessionFreshnessDialog classNames={classNames} onOpenChange={setShowFreshnessDialog} open={showFreshnessDialog} />

            <Card className={cn("flex-row items-center p-4", className, classNames?.cell)}>
                <div className="flex items-center gap-3">
                    <FingerprintIcon className={cn("size-4", classNames?.icon)} />
                    <span className="text-sm">{passkey.createdAt.toLocaleString()}</span>
                </div>

                <Button
                    className={cn("relative ms-auto", classNames?.button, classNames?.outlineButton)}
                    disabled={isLoading}
                    onClick={handleDeletePasskey}
                    size="sm"
                    variant="outline"
                >
                    {isLoading && <Loader2 className="animate-spin" />}
                    {t`Delete`}
                </Button>
            </Card>
        </>
    );
};
