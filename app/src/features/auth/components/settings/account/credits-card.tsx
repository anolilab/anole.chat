"use client";

import { t } from "@lingui/core/macro";
import { Coins, Crown } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConvexQuery } from "@/lib/convex/use-query";
import { api } from "@/lib/convex/_generated/api";
import { cn } from "@/lib/utils";

import type { SettingsCardClassNames } from "../shared/settings-card";

export interface CreditsCardProperties {
    className?: string;
    classNames?: SettingsCardClassNames;
}

export const CreditsCard = ({ className, classNames }: CreditsCardProperties) => {
    const credits = useConvexQuery(api.auth.functions.getUserCredits);
    const creditStatus = useConvexQuery(api.auth.functions.getUserCreditStatus);

    return (
        <Card className={cn("", className, classNames?.card)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    {t`Credits`}
                </CardTitle>
                <CardDescription>
                    {t`Your remaining credits for AI interactions`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                        {credits ?? 0} {t`credits`}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                            {t`1 credit per message`}
                        </div>
                        {creditStatus?.skipCreditChecks && (
                            <Badge variant="default" className="bg-purple-500">
                                <Crown className="mr-1 h-3 w-3" />
                                {t`Unlimited`}
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                    {creditStatus?.skipCreditChecks 
                        ? t`You have unlimited messaging enabled. Credits are not consumed when sending messages.`
                        : t`Credits are consumed when you send messages to AI models. Get more credits by upgrading your plan.`
                    }
                </div>
            </CardContent>
        </Card>
    );
};