"use client";

import { Loader2 } from "lucide-react";
import { type ComponentProps, useContext } from "react";
import { z } from "zod/v4";
import { t } from "@lingui/core/macro";
import { i18n } from "@lingui/core";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import type { Refetch } from "../../../types/hook-integration-types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SettingsCardClassNames } from "../shared/settings-card";

interface CreateAPIKeyDialogProps extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames;
    onSuccess: (key: string) => void;
    refetch?: Refetch;
}

export function CreateAPIKeyDialog({ classNames, onSuccess, refetch, onOpenChange, ...props }: CreateAPIKeyDialogProps) {
    const { authClient, apiKey, toast } = useContext(AuthUIContext);

    const formSchema = z.object({
        name: z.string().trim().min(1, t`Name is required`),
        expiresInDays: z.string().optional(),
    });

    const form = useAppForm({
        defaultValues: {
            name: "",
            expiresInDays: "none",
        },
        validators: {
            onChange: formSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                const expiresIn = value.expiresInDays && value.expiresInDays !== "none" ? Number.parseInt(value.expiresInDays) * 60 * 60 * 24 : undefined;

                const result = await authClient.apiKey.create({
                    name: value.name,
                    expiresIn,
                    prefix: typeof apiKey === "object" ? apiKey.prefix : undefined,
                    metadata: typeof apiKey === "object" ? apiKey.metadata : undefined,
                    fetchOptions: { throw: true },
                });

                await refetch?.();
                onSuccess(result.key);
                onOpenChange?.(false);
                form.reset();
            } catch (error) {
                toast({
                    variant: "error",
                    message: t`Failed to create API key`,
                });
            }
        },
    });

    const rtf = new Intl.RelativeTimeFormat(i18n.locale ?? "en");

    return (
        <Dialog onOpenChange={onOpenChange} {...props}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className={classNames?.dialog?.content}>
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>{t`Create API Key`}</DialogTitle>

                    <DialogDescription className={cn("text-xs md:text-sm", classNames?.description)}>
                        {t`Create a new API key for programmatic access to your account`}
                    </DialogDescription>
                </DialogHeader>

                <form.AppForm>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                        className="space-y-6"
                    >
                        <div className="flex gap-4">
                            <form.AppField
                                name="name"
                                children={(field) => (
                                    <field.FormItem className="flex-1">
                                        <field.FormLabel className={classNames?.label} required>{t`Name`}</field.FormLabel>

                                        <field.FormControl>
                                            <Input
                                                className={classNames?.input}
                                                placeholder={t`Enter a name for your API key`}
                                                autoFocus
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                required
                                            />
                                        </field.FormControl>

                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            />

                            <form.AppField
                                name="expiresInDays"
                                children={(field) => (
                                    <field.FormItem>
                                        <field.FormLabel className={classNames?.label}>{t`Expires`}</field.FormLabel>

                                        <Select onValueChange={field.handleChange} value={field.state.value}>
                                            <field.FormControl>
                                                <SelectTrigger className={classNames?.input}>
                                                    <SelectValue placeholder={t`No expiration`} />
                                                </SelectTrigger>
                                            </field.FormControl>

                                            <SelectContent>
                                                <SelectItem value="none">{t`No expiration`}</SelectItem>

                                                <SelectItem value="7">{rtf.format(7, "day")}</SelectItem>

                                                <SelectItem value="30">{rtf.format(30, "day")}</SelectItem>

                                                <SelectItem value="90">{rtf.format(90, "day")}</SelectItem>

                                                <SelectItem value="180">{rtf.format(180, "day")}</SelectItem>

                                                <SelectItem value="365">{rtf.format(365, "day")}</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className={classNames?.dialog?.footer}>
                            <form.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                                children={([canSubmit, isSubmitting]) => (
                                    <Button type="submit" disabled={!canSubmit} className={classNames?.button}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t`Create API Key`}
                                    </Button>
                                )}
                            />
                        </DialogFooter>
                    </form>
                </form.AppForm>
            </DialogContent>
        </Dialog>
    );
}
