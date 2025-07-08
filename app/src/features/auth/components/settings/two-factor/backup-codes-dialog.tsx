"use client";

import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { t } from "@lingui/core/macro";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SettingsCardClassNames } from "../shared/settings-card";

interface BackupCodesDialogProps extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames;
    backupCodes: string[];
}

export function BackupCodesDialog({ classNames, backupCodes, onOpenChange, ...props }: BackupCodesDialogProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const codesText = backupCodes.join("\n");
        navigator.clipboard.writeText(codesText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const codesText = backupCodes.join("\n");
        const blob = new Blob([codesText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "backup-codes.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog onOpenChange={onOpenChange} {...props}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className={cn("max-w-md", classNames?.dialog?.content)}>
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>{t`Backup Codes`}</DialogTitle>

                    <DialogDescription className={cn("text-xs md:text-sm", classNames?.description)}>
                        {t`Save these backup codes in a safe place. You can use them to access your account if you lose your two-factor authentication device.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-muted rounded-lg p-4">
                        <div className="grid grid-cols-1 gap-2 font-mono text-sm">
                            {backupCodes.map((code, index) => (
                                <div key={index} className="text-center">
                                    {code}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-muted-foreground text-sm">{t`Each code can only be used once. Keep them secure and treat them like passwords.`}</div>
                </div>

                <DialogFooter className={cn("flex-col gap-2 sm:flex-row", classNames?.dialog?.footer)}>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleDownload}
                        className={cn("w-full sm:w-auto", classNames?.button, classNames?.outlineButton)}
                    >
                        <DownloadIcon className="h-4 w-4" />
                        {t`Download`}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopy}
                        disabled={copied}
                        className={cn("w-full sm:w-auto", classNames?.button, classNames?.outlineButton)}
                    >
                        {copied ? (
                            <>
                                <CheckIcon className="h-4 w-4" />
                                {t`Copied!`}
                            </>
                        ) : (
                            <>
                                <CopyIcon className="h-4 w-4" />
                                {t`Copy`}
                            </>
                        )}
                    </Button>

                    <Button
                        type="button"
                        onClick={() => onOpenChange?.(false)}
                        className={cn("w-full sm:w-auto", classNames?.button, classNames?.primaryButton)}
                    >
                        {t`Done`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
