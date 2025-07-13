"use client";

import { i18n } from "@lingui/core";
import { t } from "@lingui/core/macro";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { z } from "zod/v4";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { DEFAULT_LOCALE } from "@/lib/intl/client";
import { cn } from "@/lib/utils";

import type { Refetch } from "../../../types/hook-integration-types";
import type { SettingsCardClassNames } from "../shared/settings-card";

interface CreateAPIKeyDialogProperties extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames;
    onSuccess: (key: string) => void;
    refetch?: Refetch;
}

export const CreateAPIKeyDialog = ({ classNames, onOpenChange, onSuccess, refetch, ...properties }: CreateAPIKeyDialogProperties) => {
    const { apiKey, authClient, toast } = useAuth();

    const formSchema = z
        .object({
            expiresInDays: z.string().optional(),
            name: z
                .string()
                .trim()
                .min(1, t`Name is required`),
        })
        .strict();

    const form = useAppForm({
        defaultValues: {
            expiresInDays: "none",
            name: "",
        },
        onSubmit: async ({ value }) => {
            try {
                const expiresIn = value.expiresInDays && value.expiresInDays !== "none" ? Number.parseInt(value.expiresInDays) * 60 * 60 * 24 : undefined;

                const result = await authClient.apiKey.create({
                    expiresIn,
                    fetchOptions: { throw: true },
                    metadata: typeof apiKey === "object" ? apiKey.metadata : undefined,
                    name: value.name,
                    prefix: typeof apiKey === "object" ? apiKey.prefix : undefined,
                });

                await refetch?.();
                onSuccess(result.key);
                onOpenChange?.(false);
                form.reset();
            } catch {
                toast({
                    message: t`Failed to create API key`,
                    variant: "error",
                });
            }
        },
        validators: {
            onChange: formSchema,
        },
    });

    const rtf = new Intl.RelativeTimeFormat(i18n.locale ?? DEFAULT_LOCALE);

    return (
        <Dialog onOpenChange={onOpenChange} {...properties}>
            <DialogContent
                className={classNames?.dialog?.content}
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                }}
            >
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>{t`Create API Key`}</DialogTitle>

                    <DialogDescription className={cn("text-xs md:text-sm", classNames?.description)}>
                        {t`Create a new API key for programmatic access to your account`}
                    </DialogDescription>
                </DialogHeader>

                <form.AppForm>
                    <form
                        className="space-y-6"
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                    >
                        <div className="flex gap-4">
                            <form.AppField
                                children={(field) => (
                                    <field.FormItem className="flex-1">
                                        <field.FormLabel className={classNames?.label} required>{t`Name`}</field.FormLabel>

                                        <field.FormControl>
                                            <Input
                                                autoFocus
                                                className={classNames?.input}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => {
                                                    field.handleChange(e.target.value);
                                                }}
                                                placeholder={t`Enter a name for your API key`}
                                                required
                                                value={field.state.value}
                                            />
                                        </field.FormControl>

                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                                name="name"
                            />

                            <form.AppField
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
                                name="expiresInDays"
                            />
                        </div>

                        <DialogFooter className={classNames?.dialog?.footer}>
                            <form.Subscribe
                                children={([canSubmit, isSubmitting]) => (
                                    <Button className={classNames?.button} disabled={!canSubmit} type="submit">
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t`Create API Key`}
                                    </Button>
                                )}
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                            />
                        </DialogFooter>
                    </form>
                </form.AppForm>
            </DialogContent>
        </Dialog>
    );
};
