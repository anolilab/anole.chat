"use client";

import { ShieldCheckIcon, ShieldOffIcon } from "lucide-react";
import { useContext, useState } from "react";
import { t } from "@lingui/core/macro";

import { SettingsCard, type SettingsCardProps } from "../shared/settings-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TwoFactorPasswordDialog } from "./two-factor-password-dialog";

export interface TwoFactorCardProps extends Omit<SettingsCardProps, "onToggle"> {
    isEnabled?: boolean;
    onToggle?: (enable: boolean) => Promise<void>;
    onShowBackupCodes?: () => void;
}

export function TwoFactorCard({ isEnabled = false, onToggle, onShowBackupCodes, ...props }: TwoFactorCardProps) {
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const handleToggle = async () => {
        if (onToggle) {
            setIsPending(true);
            try {
                await onToggle(!isEnabled);
            } finally {
                setIsPending(false);
            }
        } else {
            // Show password dialog if no custom onToggle is provided
            setShowPasswordDialog(true);
        }
    };

    const handlePasswordDialogClose = () => {
        setShowPasswordDialog(false);
    };

    return (
        <>
            <SettingsCard
                {...props}
                header={
                    <div className="flex items-center gap-2">
                        {isEnabled ? (
                            <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                        ) : (
                            <ShieldOffIcon className="text-muted-foreground h-5 w-5" />
                        )}
                        {t`Two-Factor Authentication`}
                        <Badge variant={isEnabled ? "default" : "secondary"}>
                            {isEnabled ? t`Enabled` : t`Disabled`}
                        </Badge>
                    </div>
                }
                description={
                    isEnabled
                        ? t`Two-factor authentication is currently enabled for your account. This adds an extra layer of security.`
                        : t`Add an extra layer of security to your account by enabling two-factor authentication.`
                }
                footer={
                    <div className="flex gap-2">
                        <Button 
                            variant={isEnabled ? "destructive" : "default"} 
                            onClick={handleToggle} 
                            disabled={isPending} 
                            className="w-fit"
                        >
                            {isPending 
                                ? (isEnabled ? t`Disabling...` : t`Enabling...`) 
                                : (isEnabled ? t`Disable 2FA` : t`Enable 2FA`)
                            }
                        </Button>

                        {isEnabled && onShowBackupCodes && (
                            <Button variant="outline" onClick={onShowBackupCodes} className="w-fit">
                                {t`View Backup Codes`}
                            </Button>
                        )}
                    </div>
                }
            >
                {isEnabled ? (
                    <div className="space-y-3">
                        <div className="text-sm">
                            {t`Two-factor authentication is active. You'll need your authenticator app or backup codes to sign in.`}
                        </div>
                        <div className="text-muted-foreground text-xs">
                            {t`Make sure you have access to your authenticator app and backup codes before disabling 2FA.`}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="text-sm">
                            {t`Enable two-factor authentication to secure your account with an additional verification step.`}
                        </div>
                        <div className="text-muted-foreground text-xs">
                            {t`You'll need an authenticator app like Google Authenticator or Authy to generate verification codes.`}
                        </div>
                    </div>
                )}
            </SettingsCard>

            <TwoFactorPasswordDialog
                open={showPasswordDialog}
                onOpenChange={handlePasswordDialogClose}
                isTwoFactorEnabled={isEnabled}
                classNames={props.classNames}
            />
        </>
    );
}
