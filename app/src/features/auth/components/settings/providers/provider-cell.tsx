"use client";

import { type ComponentProps, useState } from "react";
import { t } from "@lingui/core/macro";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SettingsCardClassNames } from "../shared/settings-card";

interface Provider {
    id: string;
    provider: string;
    email?: string;
    username?: string;
    connectedAt: string;
}

interface ProviderCellProps extends ComponentProps<"div"> {
    classNames?: SettingsCardClassNames;

    provider: Provider;
    onDisconnect?: (providerId: string) => void;
}

function getProviderDisplayName(provider: string) {
    const providers: Record<string, string> = {
        google: "Google",
        github: "GitHub",
        discord: "Discord",
        microsoft: "Microsoft",
        apple: "Apple",
        facebook: "Facebook",
        twitter: "Twitter",
        linkedin: "LinkedIn",
    };

    return providers[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function ProviderCell({ classNames, provider, onDisconnect, className, ...props }: ProviderCellProps) {
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    const displayName = getProviderDisplayName(provider.provider);
    const connectedDate = new Date(provider.connectedAt).toLocaleDateString();

    const handleDisconnect = async () => {
        if (!onDisconnect) return;

        setIsDisconnecting(true);
        try {
            await onDisconnect(provider.id);
        } finally {
            setIsDisconnecting(false);
        }
    };

    return (
        <div className={cn("flex items-center justify-between rounded-lg border p-4", className, classNames?.content)} {...props}>
            <div className="flex items-center gap-3">
                <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                    <span className="text-sm font-medium">{displayName.slice(0, 2).toUpperCase()}</span>
                </div>

                <div className="flex flex-col">
                    <div className="font-medium">{displayName}</div>
                    <div className="text-muted-foreground text-sm">
                        {provider.email || provider.username}
                        {` • ${t`Connected on ${connectedDate}`}`}
                    </div>
                </div>
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className={cn("text-destructive hover:text-destructive", classNames?.button, classNames?.outlineButton)}
            >
                {isDisconnecting ? t`Disconnecting...` : t`Disconnect`}
            </Button>
        </div>
    );
}
