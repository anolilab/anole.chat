"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { t } from "@lingui/core/macro";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SettingsCardClassNames } from "../shared/settings-card";

interface APIKeyDisplayDialogProps extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames;

    apiKey: string;
}

export function APIKeyDisplayDialog({ classNames, apiKey, onOpenChange, ...props }: APIKeyDisplayDialogProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(apiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog onOpenChange={onOpenChange} {...props}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className={classNames?.dialog?.content}>
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>{t`API Key Created`}</DialogTitle>

                    <DialogDescription
                        className={cn("text-xs md:text-sm", classNames?.description)}
                    >{t`Your API key has been created successfully. Make sure to copy it now as you won't be able to see it again.`}</DialogDescription>
                </DialogHeader>

                <div className="bg-muted break-all rounded-md p-4 font-mono text-sm">{apiKey}</div>

                <DialogFooter className={classNames?.dialog?.footer}>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopy}
                        disabled={copied}
                        className={cn(classNames?.button, classNames?.outlineButton)}
                    >
                        {copied ? (
                            <>
                                <CheckIcon className={classNames?.icon} />
                                {t`Copied to clipboard`}
                            </>
                        ) : (
                            <>
                                <CopyIcon className={classNames?.icon} />
                                {t`Copy to clipboard`}
                            </>
                        )}
                    </Button>

                    <Button type="button" variant="default" onClick={() => onOpenChange?.(false)} className={cn(classNames?.button, classNames?.primaryButton)}>
                        {t`Done`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
