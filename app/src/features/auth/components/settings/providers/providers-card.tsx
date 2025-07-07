"use client"

import { useContext } from "react"

import { AuthUIContext } from "../../../lib/auth-ui-provider"
import { socialProviders } from "../../../lib/social-providers"
import { cn } from "@/lib/utils"
import type { AuthLocalization } from "../../../localization/auth-localization"
import type { Refetch } from "../../../types/hook-integration-types"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SettingsCard } from "../shared/settings-card"
import type { SettingsCardClassNames } from "../shared/settings-card"
import { ProviderCell } from "./provider-cell"

export interface ProvidersCardProps {
    className?: string
    classNames?: SettingsCardClassNames
    accounts?: { accountId: string; provider: string }[] | null
    isPending?: boolean
    localization?: Partial<AuthLocalization>
    skipHook?: boolean
    refetch?: Refetch
}

export function ProvidersCard({
    className,
    classNames,
    accounts,
    isPending,
    localization,
    skipHook,
    refetch
}: ProvidersCardProps) {
    const {
        hooks: { useListAccounts },
        localization: contextLocalization,
        social,
        genericOAuth
    } = useContext(AuthUIContext)

    localization = { ...contextLocalization, ...localization }

    if (!skipHook) {
        const result = useListAccounts()
        accounts = result.data
        isPending = result.isPending
        refetch = result.refetch
    }

    return (
        <SettingsCard
            className={className}
            classNames={classNames}
            title={localization.PROVIDERS}
            description={localization.PROVIDERS_DESCRIPTION}
            isPending={isPending}
        >
            <CardContent className={cn("grid gap-4", classNames?.content)}>
                {isPending ? (
                    social?.providers?.map((provider) => (
                        <Card
                            key={provider}
                            className={cn(
                                "flex-row items-center gap-3 px-4 py-3",
                                classNames?.cell
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Skeleton
                                    className={cn("size-5 rounded-full", classNames?.skeleton)}
                                />

                                <div>
                                    <Skeleton
                                        className={cn("h-4 w-24", classNames?.skeleton)}
                                    />
                                </div>
                            </div>

                            <Skeleton
                                className={cn("ms-auto size-8 w-12", classNames?.skeleton)}
                            />
                        </Card>
                    ))
                ) : (
                    <>
                        {social?.providers?.map((provider) => {
                            const socialProvider = socialProviders.find(
                                (socialProvider) =>
                                    socialProvider.provider === provider
                            )

                            if (!socialProvider) return null

                            return (
                                <ProviderCell
                                    key={provider}
                                    classNames={classNames}
                                    account={accounts?.find(
                                        (acc) => acc.provider === provider
                                    )}
                                    provider={socialProvider}
                                    refetch={refetch}
                                />
                            )
                        })}

                        {genericOAuth?.providers?.map((provider) => (
                            <ProviderCell
                                key={provider.provider}
                                classNames={classNames}
                                account={accounts?.find(
                                    (acc) => acc.provider === provider.provider
                                )}
                                provider={provider}
                                refetch={refetch}
                                other
                            />
                        ))}
                    </>
                )}
            </CardContent>
        </SettingsCard>
    )
}
