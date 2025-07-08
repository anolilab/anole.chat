"use client";

import { type ComponentProps, useState } from "react";
import { t } from "@lingui/core/macro";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SettingsCardClassNames } from "./settings-card";

interface SessionFreshnessDialogProps extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames;

    onVerified?: () => void;
}

export function SessionFreshnessDialog({ classNames, onVerified, onOpenChange, ...props }: SessionFreshnessDialogProps) {
    const [password, setPassword] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) return;

        setIsPending(true);
        setError("");

        try {
            // This would typically verify the password with the auth service
            // For now, we'll simulate success after a short delay
            await new Promise((resolve) => setTimeout(resolve, 1000));

            onVerified?.();
            onOpenChange?.(false);
            setPassword("");
        } catch (err) {
            setError(t`Invalid password. Please try again.`);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Dialog onOpenChange={onOpenChange} {...props}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className={classNames?.dialog?.content}>
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>{t`Verify Your Identity`}</DialogTitle>

                    <DialogDescription className={cn("text-xs md:text-sm", classNames?.description)}>
                        {t`For security reasons, please confirm your password to continue with this action.`}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="verification-password">{t`Current Password`}</Label>
                        <Input
                            id="verification-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t`Enter your current password`}
                            required
                            autoFocus
                        />
                        {error && <p className="text-destructive text-sm">{error}</p>}
                    </div>

                    <DialogFooter className={classNames?.dialog?.footer}>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange?.(false)}
                            disabled={isPending}
                            className={cn(classNames?.button, classNames?.outlineButton)}
                        >
                            {t`Cancel`}
                        </Button>

                        <Button type="submit" disabled={!password.trim() || isPending} className={cn(classNames?.button, classNames?.primaryButton)}>
                            {isPending ? t`Verifying...` : t`Verify`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
