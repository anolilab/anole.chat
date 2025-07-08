"use client";

import { KeyRoundIcon, Loader2 } from "lucide-react";
import { type ComponentProps, useContext, useState } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { getLocalizedError } from "../../../lib/utils";
import { cn } from "@/lib/utils";
import type { ApiKey } from "../../../types/data-structure-types";
import type { Refetch } from "../../../types/hook-integration-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SettingsCardClassNames } from "../shared/settings-card";
import { i18n } from "@lingui/core";
import { DEFAULT_LOCALE } from "@/lib/intl/client";

interface ApiKeyDeleteDialogProps extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames;
    apiKey: ApiKey;

    refetch?: Refetch;
}

export function ApiKeyDeleteDialog({ classNames, apiKey, refetch, onOpenChange, ...props }: ApiKeyDeleteDialogProps) {
    const {
        mutators: { deleteApiKey },
        toast,
    } = useContext(AuthUIContext);

    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        setIsLoading(true);

        try {
            await deleteApiKey({ keyId: apiKey.id });
            await refetch?.();
            onOpenChange?.(false);
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error }),
            });
        }

        setIsLoading(false);
    };

    // Format expiration date or show "Never expires"
    const formatExpiration = () => {
        if (!apiKey.expiresAt) return t`Never expires`;

        const expiresDate = new Date(apiKey.expiresAt);
        return `${t`Expires`} ${expiresDate.toLocaleDateString(i18n.locale ?? DEFAULT_LOCALE, {
            month: "short",
            day: "numeric",
            year: "numeric",
        })}`;
    };

    return (
        <Dialog onOpenChange={onOpenChange} {...props}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className={classNames?.dialog?.content}>
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>
                        {t`Delete`} {t`API Key`}
                    </DialogTitle>

                    <DialogDescription
                        className={cn("text-xs md:text-sm", classNames?.description)}
                    >{t`Are you sure you want to delete this API key? This action cannot be undone.`}</DialogDescription>
                </DialogHeader>

                <Card className={cn("my-2 flex-row items-center gap-3 px-4 py-3", classNames?.cell)}>
                    <KeyRoundIcon className={cn("size-4", classNames?.icon)} />

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{apiKey.name}</span>

                            <span className="text-muted-foreground text-sm">
                                {apiKey.start}
                                {"******"}
                            </span>
                        </div>

                        <div className="text-muted-foreground text-xs">{formatExpiration()}</div>
                    </div>
                </Card>

                <DialogFooter className={classNames?.dialog?.footer}>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onOpenChange?.(false)}
                        disabled={isLoading}
                        className={cn(classNames?.button, classNames?.secondaryButton)}
                    >
                        {t`Cancel`}
                    </Button>

                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                        className={cn(classNames?.button, classNames?.destructiveButton)}
                    >
                        {isLoading && <Loader2 className="animate-spin" />}
                        {t`Delete`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
