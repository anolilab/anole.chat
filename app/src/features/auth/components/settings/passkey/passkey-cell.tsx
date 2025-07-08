"use client";

import { MoreHorizontalIcon, SmartphoneIcon, TabletIcon, MonitorIcon } from "lucide-react";
import { useState } from "react";
import { t } from "@lingui/core/macro";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { SettingsCardClassNames } from "../shared/settings-card";

interface PasskeyDevice {
    id: string;
    name: string;
    type: "mobile" | "tablet" | "desktop";
    createdAt: string;
    lastUsed?: string;
}

interface PasskeyCellProps {
    classNames?: SettingsCardClassNames;

    passkey: PasskeyDevice;
    onDelete?: (passkeyId: string) => void;
}

function getDeviceIcon(type: PasskeyDevice["type"]) {
    switch (type) {
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

export function PasskeyCell({ classNames, passkey, onDelete }: PasskeyCellProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const DeviceIcon = getDeviceIcon(passkey.type);
    const createdDate = new Date(passkey.createdAt).toLocaleDateString();
    const lastUsedDate = passkey.lastUsed ? new Date(passkey.lastUsed).toLocaleDateString() : null;

    const handleDelete = async () => {
        if (!onDelete) return;

        setIsDeleting(true);
        try {
            await onDelete(passkey.id);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={cn("flex items-center justify-between rounded-lg border p-4", classNames?.content)}>
            <div className="flex items-center gap-3">
                <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                    <DeviceIcon className="h-5 w-5" />
                </div>

                <div className="flex flex-col">
                    <div className="font-medium">{passkey.name}</div>
                    <div className="text-muted-foreground text-sm">
                        {t`Created on ${createdDate}`}
                        {lastUsedDate && ` • ${t`Last used ${lastUsedDate}`}`}
                    </div>
                </div>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isDeleting}>
                        <MoreHorizontalIcon className="h-4 w-4" />
                        <span className="sr-only">{t`More options`}</span>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-destructive">
                        {isDeleting ? t`Deleting...` : t`Delete`}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
