"use client";

import { t } from "@lingui/core/macro";
import { use } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import { socialProviders } from "../../../lib/social-providers";
import type { Refetch } from "../../../types/hook-integration-types";
import type { SettingsCardClassNames } from "../shared/settings-card";
import { SettingsCard } from "../shared/settings-card";
import { ProviderCell } from "./provider-cell";

export interface ProvidersCardProperties {
    accounts?: { accountId: string; provider: string }[] | null;
    className?: string;
    classNames?: SettingsCardClassNames;
    isPending?: boolean;
    refetch?: Refetch;
    skipHook?: boolean;
}

export const ProvidersCard = ({ accounts, className, classNames, isPending, refetch, skipHook }: ProvidersCardProperties) => {
    const {
        genericOAuth,
        hooks: { useListAccounts },
        social,
    } = useAuth();

    if (!skipHook) {
        const result = useListAccounts();

        accounts = result.data;
        isPending = result.isPending;
        refetch = result.refetch;
    }

    return (
        <SettingsCard
            className={className}
            classNames={classNames}
            description={t`Manage your connected social accounts and third-party providers`}
            isPending={isPending}
            title={t`Connected Accounts`}
        >
            <CardContent className={cn("grid gap-4", classNames?.content)}>
                {isPending
                    ? social?.providers?.map((provider) => (
                        <Card className={cn("flex-row items-center gap-3 px-4 py-3", classNames?.cell)} key={provider}>
                            <div className="flex items-center gap-2">
                                <Skeleton className={cn("size-5 rounded-full", classNames?.skeleton)} />

                                <div>
                                    <Skeleton className={cn("h-4 w-24", classNames?.skeleton)} />
                                </div>
                            </div>

                            <Skeleton className={cn("ms-auto size-8 w-12", classNames?.skeleton)} />
                        </Card>
                    ))
                    : (
                        <>
                            {social?.providers?.map((provider) => {
                                const socialProvider = socialProviders.find((socialProvider) => socialProvider.provider === provider);

                                if (!socialProvider)
                                    return null;

                                return (
                                    <ProviderCell
                                        account={accounts?.find((accumulator) => accumulator.provider === provider)}
                                        classNames={classNames}
                                        key={provider}
                                        provider={socialProvider}
                                        refetch={refetch}
                                    />
                                );
                            })}

                            {genericOAuth?.providers?.map((provider) => (
                                <ProviderCell
                                    account={accounts?.find((accumulator) => accumulator.provider === provider.provider)}
                                    classNames={classNames}
                                    key={provider.provider}
                                    other
                                    provider={provider}
                                    refetch={refetch}
                                />
                            ))}
                        </>
                    )}
            </CardContent>
        </SettingsCard>
    );
};
