"use client";

import { t } from "@lingui/core/macro";
import { Crown, Shield, Zap } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useConvexMutation, useConvexQuery } from "@/lib/convex/use-query";
import { api } from "@/lib/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import type { SettingsCardClassNames } from "../shared/settings-card";

export interface CreditManagementCardProperties {
    className?: string;
    classNames?: SettingsCardClassNames;
}

export const CreditManagementCard = ({ className, classNames }: CreditManagementCardProperties) => {
    const [isUpdating, setIsUpdating] = useState(false);
    
    const { hooks: { useSession } } = useAuth();
    const { data: sessionData } = useSession();
    
    const creditStatus = useConvexQuery(api.auth.functions.getUserCreditStatus);
    const toggleSkipCreditChecks = useConvexMutation(api.auth.functions.toggleSkipCreditChecks);

    const handleToggleSkipCreditChecks = async (enabled: boolean) => {
        if (!sessionData?.user?.id) return;
        
        setIsUpdating(true);
        try {
            await toggleSkipCreditChecks({
                userId: sessionData.user.id as any, // Type assertion for Convex ID
                skipCreditChecks: enabled,
            });
        } catch (error) {
            console.error("Failed to toggle skip credit checks:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    if (!creditStatus) {
        return (
            <Card className={cn("", className, classNames?.card)}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {t`Credit Management`}
                    </CardTitle>
                    <CardDescription>
                        {t`Loading credit status...`}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className={cn("", className, classNames?.card)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {t`Credit Management`}
                </CardTitle>
                <CardDescription>
                    {t`Manage your credit settings and permissions`}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Credit Status */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                        <Zap className="h-6 w-6 text-yellow-500" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t`Current Credits`}</p>
                            <p className="text-2xl font-bold">{creditStatus.credits}</p>
                        </div>
                    </div>
                    {creditStatus.skipCreditChecks && (
                        <Badge variant="default" className="bg-purple-500">
                            <Crown className="mr-1 h-3 w-3" />
                            {t`Unlimited`}
                        </Badge>
                    )}
                </div>

                {/* Skip Credit Checks Setting */}
                {creditStatus.canManage && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">{t`Skip Credit Checks`}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t`When enabled, you can send messages without consuming credits`}
                                </p>
                            </div>
                            <Switch
                                checked={creditStatus.skipCreditChecks}
                                disabled={isUpdating}
                                onCheckedChange={handleToggleSkipCreditChecks}
                            />
                        </div>
                        
                        {creditStatus.skipCreditChecks && (
                            <Alert>
                                <Crown className="h-4 w-4" />
                                <AlertDescription>
                                    {t`Credit checks are disabled. You can send unlimited messages without consuming credits.`}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}

                {/* Info for Non-Admins */}
                {!creditStatus.canManage && creditStatus.skipCreditChecks && (
                    <Alert>
                        <Crown className="h-4 w-4" />
                        <AlertDescription>
                            {t`You have unlimited messaging enabled. Contact an administrator to modify this setting.`}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Usage Information */}
                <div className="rounded-lg bg-muted p-3">
                    <h4 className="mb-2 font-medium">{t`How Credits Work`}</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• {t`Each AI message costs 1 credit`}</li>
                        <li>• {t`Credits are consumed when you send messages`}</li>
                        <li>• {t`You can purchase more credits or upgrade your plan`}</li>
                        {creditStatus.skipCreditChecks && (
                            <li>• {t`Your account has unlimited messaging enabled`}</li>
                        )}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
};