"use client";

import { t } from "@lingui/core/macro";
import type { SocialProvider } from "better-auth/social-providers";
import { Loader2 } from "lucide-react";
import { use, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import type { Provider } from "../../../lib/social-providers";
import type { Refetch } from "../../../types/hook-integration-types";
import type { SettingsCardClassNames } from "../shared/settings-card";

export interface ProviderCellProperties {
    account?: { accountId: string; provider: string } | null;
    className?: string;
    classNames?: SettingsCardClassNames;
    isPending?: boolean;
    other?: boolean;
    provider: Provider;
    refetch?: Refetch;
}

export const ProviderCell = ({ account, className, classNames, other, provider, refetch }: ProviderCellProperties) => {
    const {
        authClient,
        basePath,
        baseURL,
        mutators: { unlinkAccount },
        toast,
        viewPaths,
    } = useAuth();

    const [isLoading, setIsLoading] = useState(false);

    const handleLink = async () => {
        setIsLoading(true);
        const callbackURL = `${baseURL}${basePath}/${viewPaths.CALLBACK}?redirectTo=${globalThis.location.pathname}`;

        try {
            if (other) {
                await authClient.oauth2.link({
                    callbackURL,
                    fetchOptions: { throw: true },
                    providerId: provider.provider as SocialProvider,
                });
            } else {
                await authClient.linkSocial({
                    callbackURL,
                    fetchOptions: { throw: true },
                    provider: provider.provider as SocialProvider,
                });
            }
        } catch {
            toast({
                message: t`Failed to link account`,
                variant: "error",
            });

            setIsLoading(false);
        }
    };

    const handleUnlink = async () => {
        setIsLoading(true);

        try {
            await unlinkAccount({
                accountId: account?.accountId,
                providerId: provider.provider,
            });

            await refetch?.();
        } catch {
            toast({
                message: t`Failed to unlink account`,
                variant: "error",
            });
        }

        setIsLoading(false);
    };

    return (
        <Card className={cn("flex-row items-center gap-3 px-4 py-3", className, classNames?.cell)}>
            {provider.icon && <provider.icon className={cn("size-4", classNames?.icon)} />}

            <span className="text-sm">{provider.name}</span>

            <Button
                className={cn("relative ms-auto", classNames?.button)}
                disabled={isLoading}
                onClick={account ? handleUnlink : handleLink}
                size="sm"
                type="button"
                variant={account ? "outline" : "default"}
            >
                {isLoading && <Loader2 className="animate-spin" />}
                {account ? t`Unlink` : t`Link`}
            </Button>
        </Card>
    );
};
