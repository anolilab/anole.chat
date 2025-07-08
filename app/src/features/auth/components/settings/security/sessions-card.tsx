"use client";
import { useContext } from "react";
import { t } from "@lingui/core/macro";
import { UAParser } from "my-ua-parser";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsCard } from "../shared/settings-card";
import type { SettingsCardClassNames } from "../shared/settings-card";
import { SessionCell } from "./session-cell";
import clsx from "clsx";

export interface SessionsCardProps {
    className?: string;
    classNames?: SettingsCardClassNames;
}

function parseUserAgent(userAgent: string | null | undefined) {
    if (!userAgent) {
        return {
            deviceType: "desktop" as const,
            deviceName: undefined,
            browser: undefined,
            os: undefined,
        };
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Determine device type based on parsed data
    let deviceType: "mobile" | "tablet" | "desktop" = "desktop";
    if (result.device?.type === "mobile") {
        deviceType = "mobile";
    } else if (result.device?.type === "tablet") {
        deviceType = "tablet";
    }

    return {
        deviceType,
        deviceName: result.device?.model || result.device?.vendor,
        browser: result.browser?.name && result.browser?.version
            ? `${result.browser.name} ${result.browser.version}`
            : result.browser?.name,
        os: result.os?.name && result.os?.version
            ? `${result.os.name} ${result.os.version}`
            : result.os?.name,
    };
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
        <SettingsCard className={clsx(className, "pb-6")} classNames={classNames} description={t`Manage your active sessions`} isPending={isPending} title={t`Sessions`}>
            <CardContent className={cn("grid gap-4", classNames?.content)}>
                {isPending ? (
                    <div className={cn("flex items-center justify-between rounded-lg border p-4", classNames?.content)}>
                        <div className="flex items-center gap-3">
                            <Skeleton className={cn("h-10 w-10 rounded-lg", classNames?.skeleton)} />
                            <div className="flex flex-col gap-2">
                                <Skeleton className={cn("h-4 w-24", classNames?.skeleton)} />
                                <Skeleton className={cn("h-3 w-32", classNames?.skeleton)} />
                            </div>
                        </div>
                        <Skeleton className={cn("h-8 w-8 rounded", classNames?.skeleton)} />
                    </div>
                ) : (
                    sessions?.map((session) => {
                        const isCurrent = session.id === currentSession?.session?.id;
                        const parsedUA = parseUserAgent(session.userAgent);

                        // Transform the session data to match SessionCell's expected format
                        const sessionData = {
                            id: session.id,
                            deviceType: parsedUA.deviceType,
                            deviceName: parsedUA.deviceName,
                            browser: parsedUA.browser,
                            os: parsedUA.os,
                            ipAddress: session.ipAddress || undefined,
                            isCurrent,
                            createdAt: session.createdAt.toISOString(),
                            lastActiveAt: session.createdAt.toISOString(), // Using createdAt as fallback since lastActiveAt might not be available
                        };

                        return (
                            <SessionCell
                                key={session.id}
                                classNames={classNames}
                                session={sessionData}
                                onRevokeSession={() => handleRevokeSession(session.token)}
                            />
                        );
                    })
                )}
            </CardContent>
        </SettingsCard>
    );
}
