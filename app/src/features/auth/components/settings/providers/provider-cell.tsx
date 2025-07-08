"use client";

import type { SocialProvider } from "better-auth/social-providers";
import { Loader2 } from "lucide-react";
import { useContext, useState } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import type { Provider } from "../../../lib/social-providers";
import { cn } from "@/lib/utils";
import type { Refetch } from "../../../types/hook-integration-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SettingsCardClassNames } from "../shared/settings-card";

export interface ProviderCellProps {
    className?: string;
    classNames?: SettingsCardClassNames;
    account?: { accountId: string; provider: string } | null;
    isPending?: boolean;
    other?: boolean;
    provider: Provider;
    refetch?: Refetch;
}

export function ProviderCell({ className, classNames, account, other, provider, refetch }: ProviderCellProps) {
    const {
        authClient,
        basePath,
        baseURL,
        mutators: { unlinkAccount },
        viewPaths,
        toast,
    } = useContext(AuthUIContext);

    const [isLoading, setIsLoading] = useState(false);

    const handleLink = async () => {
        setIsLoading(true);
        const callbackURL = `${baseURL}${basePath}/${viewPaths.CALLBACK}?redirectTo=${window.location.pathname}`;

        try {
            if (other) {
                await authClient.oauth2.link({
                    providerId: provider.provider as SocialProvider,
                    callbackURL,
                    fetchOptions: { throw: true },
                });
            } else {
                await authClient.linkSocial({
                    provider: provider.provider as SocialProvider,
                    callbackURL,
                    fetchOptions: { throw: true },
                });
            }
        } catch (error) {
            toast({
                variant: "error",
                message: t`Failed to link account`,
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
        } catch (error) {
            toast({
                variant: "error",
                message: t`Failed to unlink account`,
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
                size="sm"
                type="button"
                variant={account ? "outline" : "default"}
                onClick={account ? handleUnlink : handleLink}
            >
                {isLoading && <Loader2 className="animate-spin" />}
                {account ? t`Unlink` : t`Link`}
            </Button>
        </Card>
    );
}
