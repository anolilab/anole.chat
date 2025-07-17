"use client";

import { t } from "@lingui/core/macro";
import { Coins } from "lucide-react";

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
                    <div className="text-sm text-muted-foreground">
                        {t`1 credit per message`}
                    </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                    {t`Credits are consumed when you send messages to AI models. Get more credits by upgrading your plan.`}
                </div>
            </CardContent>
        </Card>
    );
};