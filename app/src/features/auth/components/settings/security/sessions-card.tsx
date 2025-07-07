"use client"
import { useContext } from "react"

import { AuthUIContext } from "../../../lib/auth-ui-provider"
import { cn } from "@/lib/utils"
import type { AuthLocalization } from "../../../localization/auth-localization"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SettingsCard } from "../shared/settings-card"
import type { SettingsCardClassNames } from "../shared/settings-card"
import { SessionCell } from "./session-cell"

export interface SessionsCardProps {
    className?: string
    classNames?: SettingsCardClassNames
    localization?: Partial<AuthLocalization>
}

export function SessionsCard({
    className,
    classNames,
    localization
}: SessionsCardProps) {
    const {
        hooks: { useListSessions },
        localization: contextLocalization
    } = useContext(AuthUIContext)

    localization = { ...contextLocalization, ...localization }

    const { data: sessions, isPending, refetch } = useListSessions()

    return (
        <SettingsCard
            className={className}
            classNames={classNames}
            description={localization.SESSIONS_DESCRIPTION}
            isPending={isPending}
            title={localization.SESSIONS}
        >
            <CardContent className={cn("grid gap-4", classNames?.content)}>
                {isPending ? (
                    <Card
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
                ) : (
                    sessions?.map((session) => (
                        <SessionCell
                            key={session.id}
                            classNames={classNames}
                            localization={localization}
                            session={session}
                            refetch={refetch}
                        />
                    ))
                )}
            </CardContent>
        </SettingsCard>
    )
}
