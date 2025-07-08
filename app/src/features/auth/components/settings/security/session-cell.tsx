"use client";

import { MonitorIcon, SmartphoneIcon, TabletIcon, MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { t } from "@lingui/core/macro";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { SettingsCardClassNames } from "../shared/settings-card";

interface Session {
    id: string;
    deviceType: "mobile" | "tablet" | "desktop";
    deviceName?: string;
    browser?: string;
    os?: string;
    location?: string;
    ipAddress?: string;
    isCurrent: boolean;
    createdAt: string;
    lastActiveAt: string;
}

interface SessionCellProps {
    classNames?: SettingsCardClassNames;

    session: Session;
    onRevokeSession?: (sessionId: string) => void;
}

function getDeviceIcon(deviceType: Session["deviceType"]) {
    switch (deviceType) {
        case "mobile":
            return SmartphoneIcon;
        case "tablet":
            return TabletIcon;
        case "desktop":
            return MonitorIcon;
        default:
            return MonitorIcon;
    }
}

export function SessionCell({ classNames, session, onRevokeSession }: SessionCellProps) {
    const [isRevoking, setIsRevoking] = useState(false);

    const DeviceIcon = getDeviceIcon(session.deviceType);
    const createdDate = new Date(session.createdAt).toLocaleDateString();
    const lastActiveDate = new Date(session.lastActiveAt).toLocaleDateString();

    const handleRevoke = async () => {
        if (!onRevokeSession || session.isCurrent) return;

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
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isRevoking}>
                            <MoreHorizontalIcon className="h-4 w-4" />
                            <span className="sr-only">{t`More options`}</span>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleRevoke} disabled={isRevoking} className="text-destructive">
                            {isRevoking ? t`Revoking...` : t`Revoke Session`}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
