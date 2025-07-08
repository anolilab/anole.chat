"use client";

import { type ComponentProps, useState } from "react";
import { t } from "@lingui/core/macro";

import { SettingsCard } from "../shared/settings-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ChangeEmailCardProps extends ComponentProps<typeof SettingsCard> {
    currentEmail?: string;
    onChangeEmail?: (newEmail: string) => Promise<void>;
}

export function ChangeEmailCard({ currentEmail, onChangeEmail, ...props }: ChangeEmailCardProps) {
    const [newEmail, setNewEmail] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!onChangeEmail || !newEmail.trim()) return;

        setIsPending(true);
        try {
            await onChangeEmail(newEmail.trim());
            setNewEmail("");
            setShowForm(false);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <SettingsCard
            {...props}
            header={t`Email Address`}
            description={t`Update your account email address. You'll need to verify the new email address.`}
            footer={
                !showForm ? (
                    <Button variant="outline" onClick={() => setShowForm(true)} className="w-fit">
                        {t`Change Email`}
                    </Button>
                ) : null
            }
        >
            {!showForm ? (
                <div className="space-y-2">
                    <Label>{t`Current Email`}</Label>
                    <div className="text-muted-foreground text-sm">{currentEmail || t`No email address set`}</div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t`Current Email`}</Label>
                        <div className="text-muted-foreground text-sm">{currentEmail || t`No email address set`}</div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="new-email">{t`New Email Address`}</Label>
                        <Input
                            id="new-email"
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder={t`Enter your new email address`}
                            required
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowForm(false);
                                setNewEmail("");
                            }}
                            disabled={isPending}
                        >
                            {t`Cancel`}
                        </Button>

                        <Button type="submit" disabled={!newEmail.trim() || isPending}>
                            {isPending ? t`Updating...` : t`Update Email`}
                        </Button>
                    </div>
                </form>
            )}
        </SettingsCard>
    );
}
