"use client";

import { Button } from "@anole/ui/components/button";
import { Card } from "@anole/ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@anole/ui/components/dialog";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { KeyRoundIcon, Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { useState } from "react";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { DEFAULT_LOCALE } from "@/lib/intl/client";

import { getLocalizedError } from "../../../lib/utils";
import type { ApiKey } from "../../../types/data-structure-types";
import type { Refetch } from "../../../types/hook-integration-types";
import type { SettingsCardClassNames } from "../shared/settings-card";

interface ApiKeyDeleteDialogProperties extends ComponentProps<typeof Dialog> {
    apiKey: ApiKey;
    classNames?: SettingsCardClassNames;

    refetch?: Refetch;
}

export const ApiKeyDeleteDialog = ({ apiKey, classNames, onOpenChange, refetch, ...properties }: ApiKeyDeleteDialogProperties) => {
    const {
        mutators: { deleteApiKey },
        toast,
    } = useAuth();
    const { i18n, t } = useLingui();

    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        setIsLoading(true);

        try {
            await deleteApiKey({ keyId: apiKey.id });
            await refetch?.();
            onOpenChange?.(false);
        } catch (error) {
            toast({
                message: getLocalizedError({ error, t }),
                variant: "error",
            });
        }

        setIsLoading(false);
    };

    // Format expiration date or show "Never expires"
    const formatExpiration = () => {
        if (!apiKey.expiresAt)
            return t`Never expires`;

        const expiresDate = new Date(apiKey.expiresAt);

        return `${t`Expires`} ${expiresDate.toLocaleDateString(i18n.locale ?? DEFAULT_LOCALE, {
            day: "numeric",
            month: "short",
            year: "numeric",
        })}`;
    };

    return (
        <Dialog onOpenChange={onOpenChange} {...properties}>
            <DialogContent
                className={classNames?.dialog?.content}
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                }}
            >
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>
                        {t`Delete`}
                        {" "}
                        {t`API Key`}
                    </DialogTitle>

                    <DialogDescription className={cn("text-xs md:text-sm", classNames?.description)}>
                        {t`Are you sure you want to delete this API key? This action cannot be undone.`}
                    </DialogDescription>
                </DialogHeader>

                <Card className={cn("my-2 flex-row items-center gap-3 px-4 py-3", classNames?.cell)}>
                    <KeyRoundIcon className={cn("size-4", classNames?.icon)} />

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{apiKey.name}</span>

                            <span className="text-muted-foreground text-sm">
                                {apiKey.start}
                                ******
                            </span>
                        </div>

                        <div className="text-muted-foreground text-xs">{formatExpiration()}</div>
                    </div>
                </Card>

                <DialogFooter className={classNames?.dialog?.footer}>
                    <Button
                        className={cn(classNames?.button, classNames?.secondaryButton)}
                        disabled={isLoading}
                        onClick={() => onOpenChange?.(false)}
                        type="button"
                        variant="secondary"
                    >
                        {t`Cancel`}
                    </Button>

                    <Button
                        className={cn(classNames?.button, classNames?.destructiveButton)}
                        disabled={isLoading}
                        onClick={handleDelete}
                        type="button"
                        variant="destructive"
                    >
                        {isLoading && <Loader2 className="animate-spin" />}
                        {t`Delete`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
