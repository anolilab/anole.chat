"use client";
import { useContext } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsCard } from "../shared/settings-card";
import type { SettingsCardClassNames } from "../shared/settings-card";
import { Button } from "@/components/ui/button";

export interface SessionsCardProps {
    className?: string;
    classNames?: SettingsCardClassNames;
}

export function SessionsCard({ className, classNames }: SessionsCardProps) {
    const {
        hooks: { useListSessions, useSession },
        mutators: { revokeSession },
        toast,
    } = useContext(AuthUIContext);

    const { data: sessions, isPending, refetch } = useListSessions();
    const { data: currentSession } = useSession();

    const handleRevokeSession = async (sessionToken: string) => {
        try {
            await revokeSession({ token: sessionToken });
            refetch?.();
        } catch (error) {
            toast({
                variant: "error",
                message: t`Failed to revoke session`,
            });
        }
    };

    return (
        <SettingsCard className={className} classNames={classNames} description={t`Manage your active sessions`} isPending={isPending} title={t`Sessions`}>
            <CardContent className={cn("grid gap-4", classNames?.content)}>
                {isPending ? (
                    <Card className={cn("flex-row items-center gap-3 px-4 py-3", classNames?.cell)}>
                        <div className="flex items-center gap-2">
                            <Skeleton className={cn("size-5 rounded-full", classNames?.skeleton)} />

                            <div>
                                <Skeleton className={cn("h-4 w-24", classNames?.skeleton)} />
                            </div>
                        </div>

                        <Skeleton className={cn("ms-auto size-8 w-12", classNames?.skeleton)} />
                    </Card>
                ) : (
                    sessions?.map((session) => {
                        const isCurrent = session.id === currentSession?.session?.id;
                        const createdDate = new Date(session.createdAt).toLocaleDateString();

                        return (
                            <Card key={session.id} className={cn("flex-row items-center p-4", classNames?.cell)}>
                                <div className="flex flex-1 flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{session.userAgent ? session.userAgent.split(" ")[0] : t`Unknown Device`}</span>
                                        {isCurrent && <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">{t`Current`}</span>}
                                    </div>
                                    <div className="text-muted-foreground text-sm">
                                        {session.ipAddress && `${session.ipAddress} • `}
                                        {t`Created ${createdDate}`}
                                    </div>
                                </div>

                                {!isCurrent && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRevokeSession(session.token)}
                                        className={cn(classNames?.button, classNames?.outlineButton)}
                                    >
                                        {t`Revoke`}
                                    </Button>
                                )}
                            </Card>
                        );
                    })
                )}
            </CardContent>
        </SettingsCard>
    );
}
