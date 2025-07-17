"use client";

import { Button } from "@anole/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@anole/ui/components/dialog";
import { Input } from "@anole/ui/components/input";
import { Label } from "@anole/ui/components/label";
import cn from "@anole/ui/utils/cn";
import { t } from "@lingui/core/macro";
import type { ComponentProps } from "react";
import { useState } from "react";

import type { SettingsCardClassNames } from "./settings-card";

interface SessionFreshnessDialogProperties extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames;

    onVerified?: () => void;
}

export const SessionFreshnessDialog = ({ classNames, onOpenChange, onVerified, ...properties }: SessionFreshnessDialogProperties) => {
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
        } catch {
            setError(t`Invalid password. Please try again.`);
        } finally {
            setIsPending(false);
        }
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
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>{t`Verify Your Identity`}</DialogTitle>

                    <DialogDescription className={cn("text-xs md:text-sm", classNames?.description)}>
                        {t`For security reasons, please confirm your password to continue with this action.`}
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="verification-password">{t`Current Password`}</Label>
                        <Input
                            autoFocus
                            id="verification-password"
                            onChange={(e) => {
                                setPassword(e.target.value);
                            }}
                            placeholder={t`Enter your current password`}
                            required
                            type="password"
                            value={password}
                        />
                        {error && <p className="text-destructive text-sm">{error}</p>}
                    </div>

                    <DialogFooter className={classNames?.dialog?.footer}>
                        <Button
                            className={cn(classNames?.button, classNames?.outlineButton)}
                            disabled={isPending}
                            onClick={() => onOpenChange?.(false)}
                            type="button"
                            variant="outline"
                        >
                            {t`Cancel`}
                        </Button>

                        <Button className={cn(classNames?.button, classNames?.primaryButton)} disabled={!password.trim() || isPending} type="submit">
                            {isPending ? t`Verifying...` : t`Verify`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
