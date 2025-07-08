"use client";

import { useState } from "react";
import { t } from "@lingui/core/macro";

import { useCreateAPIKey } from "../../../hooks/api-key/use-create-api-key";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SettingsCardClassNames } from "../shared/settings-card";

interface CreateAPIKeyDialogProps {
    classNames?: SettingsCardClassNames;

    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAPIKeyCreated: (apiKey: string) => void;
}

export function CreateAPIKeyDialog({ classNames, open, onOpenChange, onAPIKeyCreated }: CreateAPIKeyDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [expiresInDays, setExpiresInDays] = useState("");

    const { mutate: createAPIKey, isPending } = useCreateAPIKey({
        onSuccess: (result) => {
            onAPIKeyCreated(result.key);
            setName("");
            setDescription("");
            setExpiresInDays("");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            createAPIKey({
                name: name.trim(),
                description: description.trim() || undefined,
                expiresInDays: expiresInDays ? Number.parseInt(expiresInDays, 10) : undefined,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className={classNames?.dialog?.content}>
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>{t`Create API Key`}</DialogTitle>

                    <DialogDescription
                        className={cn("text-xs md:text-sm", classNames?.description)}
                    >{t`Create a new API key for programmatic access to your account.`}</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="api-key-name">{t`Name`}</Label>
                        <Input
                            id="api-key-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t`Enter a name for your API key`}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="api-key-description">{t`Description (optional)`}</Label>
                        <Textarea
                            id="api-key-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t`Describe what this API key will be used for`}
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="api-key-expires">{t`Expires in (days, optional)`}</Label>
                        <Input
                            id="api-key-expires"
                            type="number"
                            value={expiresInDays}
                            onChange={(e) => setExpiresInDays(e.target.value)}
                            placeholder={t`Leave empty for no expiration`}
                            min="1"
                        />
                    </div>

                    <DialogFooter className={classNames?.dialog?.footer}>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                            className={cn(classNames?.button, classNames?.outlineButton)}
                        >
                            {t`Cancel`}
                        </Button>

                        <Button type="submit" disabled={!name.trim() || isPending} className={cn(classNames?.button, classNames?.primaryButton)}>
                            {isPending ? t`Creating...` : t`Create API Key`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
