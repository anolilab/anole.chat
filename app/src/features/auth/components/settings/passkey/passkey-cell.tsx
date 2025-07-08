"use client";

import { FingerprintIcon, Loader2 } from "lucide-react";
import { useContext, useState } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SessionFreshnessDialog } from "../shared/session-freshness-dialog";
import type { SettingsCardClassNames } from "../shared/settings-card";

export interface PasskeyCellProps {
    className?: string;
    classNames?: SettingsCardClassNames;
    passkey: { id: string; createdAt: Date };
}

export function PasskeyCell({ className, classNames, passkey }: PasskeyCellProps) {
    const {
        freshAge,
        hooks: { useSession, useListPasskeys },
        mutators: { deletePasskey },
        toast,
    } = useContext(AuthUIContext);

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
        } catch (error) {
            setIsLoading(false);

            toast({
                variant: "error",
                message: t`Failed to delete passkey`,
            });
        }
    };

    return (
        <>
            <SessionFreshnessDialog 
                open={showFreshnessDialog} 
                onOpenChange={setShowFreshnessDialog} 
                classNames={classNames} 
            />

            <Card className={cn("flex-row items-center p-4", className, classNames?.cell)}>
                <div className="flex items-center gap-3">
                    <FingerprintIcon className={cn("size-4", classNames?.icon)} />
                    <span className="text-sm">{passkey.createdAt.toLocaleString()}</span>
                </div>

                <Button
                    className={cn("relative ms-auto", classNames?.button, classNames?.outlineButton)}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                    onClick={handleDeletePasskey}
                >
                    {isLoading && <Loader2 className="animate-spin" />}
                    {t`Delete`}
                </Button>
            </Card>
        </>
    );
}
