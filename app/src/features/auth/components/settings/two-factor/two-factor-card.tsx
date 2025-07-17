"use client";

import { Badge } from "@anole/ui/components/badge";
import { Button } from "@anole/ui/components/button";
import { t } from "@lingui/core/macro";
import { ShieldCheckIcon, ShieldOffIcon } from "lucide-react";
import { use, useState } from "react";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import type { User } from "@/features/auth/types/auth-core-types";

import type { SettingsCardProperties } from "../shared/settings-card";
import { SettingsCard } from "../shared/settings-card";
import { TwoFactorPasswordDialog } from "./two-factor-password-dialog";

export interface TwoFactorCardProperties extends SettingsCardProperties {
    onShowBackupCodes?: () => void;
}

export const TwoFactorCard = ({ onShowBackupCodes, ...properties }: TwoFactorCardProperties) => {
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const {
        hooks: { useSession },
    } = useAuth();

    const handleToggle = async () => {
        setShowPasswordDialog(true);
    };

    const handlePasswordDialogClose = () => {
        setShowPasswordDialog(false);
    };

    const { data: sessionData, isPending } = useSession();
    const isEnabled = (sessionData?.user as User)?.twoFactorEnabled;

    return (
        <>
            <SettingsCard
                {...properties}
                description={
                    isEnabled
                        ? t`Two-factor authentication is currently enabled for your account. This adds an extra layer of security.`
                        : t`Add an extra layer of security to your account by enabling two-factor authentication.`
                }
                header={
                    <div className="flex items-center gap-2">
                        {isEnabled ? <ShieldCheckIcon className="h-5 w-5 text-green-600" /> : <ShieldOffIcon className="text-muted-foreground h-5 w-5" />}
                        {t`Two-Factor Authentication`}
                        <Badge variant={isEnabled ? "default" : "secondary"}>{isEnabled ? t`Enabled` : t`Disabled`}</Badge>
                    </div>
                }
            >
                <div className="px-6">
                    {isEnabled ? (
                        <div className="space-y-3">
                            <div className="text-sm">{t`Two-factor authentication is active. You'll need your authenticator app or backup codes to sign in.`}</div>
                            <div className="text-muted-foreground text-xs">
                                {t`Make sure you have access to your authenticator app and backup codes before disabling 2FA.`}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="text-sm">{t`Enable two-factor authentication to secure your account with an additional verification step.`}</div>
                            <div className="text-muted-foreground text-xs">
                                {t`You'll need an authenticator app like Google Authenticator or Authy to generate verification codes.`}
                            </div>
                        </div>
                    )}
                </div>
                <div className="bg-sidebar flex flex-col items-end justify-end gap-4 rounded-b-xl border-t px-6 py-4 md:flex-row">
                    <div className="flex gap-2">
                        <Button className="w-fit" disabled={isPending} onClick={handleToggle} variant={isEnabled ? "destructive" : "default"}>
                            {isPending ? (isEnabled ? t`Disabling...` : t`Enabling...`) : isEnabled ? t`Disable 2FA` : t`Enable 2FA`}
                        </Button>

                        {isEnabled && onShowBackupCodes && (
                            <Button className="w-fit" onClick={onShowBackupCodes} variant="outline">
                                {t`View Backup Codes`}
                            </Button>
                        )}
                    </div>
                </div>
            </SettingsCard>

            <TwoFactorPasswordDialog
                classNames={properties.classNames}
                isTwoFactorEnabled={isEnabled}
                onOpenChange={handlePasswordDialogClose}
                open={showPasswordDialog}
            />
        </>
    );
};
