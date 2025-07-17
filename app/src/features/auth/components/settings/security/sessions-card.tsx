"use client";

import { CardContent } from "@anole/ui/components/card";
import { Skeleton } from "@anole/ui/components/skeleton";
import cn from "@anole/ui/utils/cn";
import { t } from "@lingui/core/macro";
import clsx from "clsx";
import { UAParser } from "my-ua-parser";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import type { SettingsCardClassNames } from "../shared/settings-card";
import { SettingsCard } from "../shared/settings-card";
import { SessionCell } from "./session-cell";

export interface SessionsCardProperties {
    className?: string;
    classNames?: SettingsCardClassNames;
}

function parseUserAgent(userAgent: string | null | undefined) {
    if (!userAgent) {
        return {
            browser: undefined,
            deviceName: undefined,
            deviceType: "desktop" as const,
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
        browser: result.browser?.name && result.browser?.version ? `${result.browser.name} ${result.browser.version}` : result.browser?.name,
        deviceName: result.device?.model || result.device?.vendor,
        deviceType,
        os: result.os?.name && result.os?.version ? `${result.os.name} ${result.os.version}` : result.os?.name,
    };
}

export const SessionsCard = ({ className, classNames }: SessionsCardProperties) => {
    const {
        hooks: { useListSessions, useSession },
        mutators: { revokeSession },
        toast,
    } = useAuth();

    const { data: sessions, isPending, refetch } = useListSessions();
    const { data: currentSession } = useSession();

    const handleRevokeSession = async (sessionToken: string) => {
        try {
            await revokeSession({ token: sessionToken });
            refetch?.();
        } catch {
            toast({
                message: t`Failed to revoke session`,
                variant: "error",
            });
        }
    };

    return (
        <SettingsCard
            className={clsx(className, "pb-6")}
            classNames={classNames}
            description={t`Manage your active sessions`}
            isPending={isPending}
            title={t`Sessions`}
        >
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
                            browser: parsedUA.browser,
                            createdAt: session.createdAt.toISOString(),
                            deviceName: parsedUA.deviceName,
                            deviceType: parsedUA.deviceType,
                            id: session.id,
                            ipAddress: session.ipAddress || undefined,
                            isCurrent,
                            lastActiveAt: session.createdAt.toISOString(), // Using createdAt as fallback since lastActiveAt might not be available
                            os: parsedUA.os,
                        };

                        return (
                            <SessionCell
                                classNames={classNames}
                                key={session.id}
                                onRevokeSession={() => handleRevokeSession(session.token)}
                                session={sessionData}
                            />
                        );
                    })
                )}
            </CardContent>
        </SettingsCard>
    );
};
