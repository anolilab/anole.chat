"use client";

import { Button } from "@anole/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@anole/ui/components/dropdown-menu";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { MonitorIcon, MoreHorizontalIcon, SmartphoneIcon, TabletIcon } from "lucide-react";
import { useState } from "react";

import type { SettingsCardClassNames } from "../shared/settings-card";

interface Session {
    browser?: string;
    createdAt: string;
    deviceName?: string;
    deviceType: "mobile" | "tablet" | "desktop";
    id: string;
    ipAddress?: string;
    isCurrent: boolean;
    lastActiveAt: string;
    location?: string;
    os?: string;
}

interface SessionCellProperties {
    classNames?: SettingsCardClassNames;

    onRevokeSession?: (sessionId: string) => void;
    session: Session;
}

function getDeviceIcon(deviceType: Session["deviceType"]) {
    switch (deviceType) {
        case "desktop": {
            return MonitorIcon;
        }
        case "mobile": {
            return SmartphoneIcon;
        }
        case "tablet": {
            return TabletIcon;
        }
        default: {
            return MonitorIcon;
        }
    }
}

export const SessionCell = ({ classNames, onRevokeSession, session }: SessionCellProperties) => {
    const [isRevoking, setIsRevoking] = useState(false);
    const { t } = useLingui();

    const DeviceIcon = getDeviceIcon(session.deviceType);
    const createdDate = new Date(session.createdAt).toLocaleDateString();
    const lastActiveDate = new Date(session.lastActiveAt).toLocaleDateString();

    const handleRevoke = async () => {
        if (!onRevokeSession || session.isCurrent)
            return;

        setIsRevoking(true);

        try {
            await onRevokeSession(session.id);
        } finally {
            setIsRevoking(false);
        }
    };

    return (
        <div className={cn("flex items-center justify-between rounded-lg border p-4", classNames?.content)}>
            <div className="flex items-center gap-3">
                <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                    <DeviceIcon className="h-5 w-5" />
                </div>

                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{session.deviceName || session.browser || t`Unknown Device`}</span>
                        {session.isCurrent && <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">{t`Current`}</span>}
                    </div>
                    <div className="text-muted-foreground text-sm">
                        {session.os && `${session.os} • `}
                        {session.location && `${session.location} • `}
                        {t`Last active ${lastActiveDate}`}
                    </div>
                </div>
            </div>

            {!session.isCurrent && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="h-8 w-8" disabled={isRevoking} size="icon" variant="ghost">
                            <MoreHorizontalIcon className="h-4 w-4" />
                            <span className="sr-only">{t`More options`}</span>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" disabled={isRevoking} onClick={handleRevoke}>
                            {isRevoking ? t`Revoking...` : t`Revoke Session`}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
};
