"use client";

import { Loader2 } from "lucide-react";
import { type ComponentProps, useContext } from "react";
import * as z from "zod";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { getLocalizedError } from "../../lib/utils";
import type { SettingsCardClassNames } from "../settings/shared/settings-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { OrganizationView } from "./organization-view";

export interface DeleteOrganizationDialogProps extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames;
}

const formSchema = z.object({
    slug: z.string().min(1, { message: t`Organization slug is required` }),
});

export function DeleteOrganizationDialog({ classNames, onOpenChange, ...props }: DeleteOrganizationDialogProps) {
    const {
        authClient,
        hooks: { useActiveOrganization, useListOrganizations },
        redirectTo,
        navigate,
        toast,
    } = useContext(AuthUIContext);

    const { data: activeOrganization, refetch: refetchActiveOrganization } = useActiveOrganization();
    const { refetch: refetchOrganizations } = useListOrganizations();

    const form = useAppForm({
        defaultValues: {
            slug: "",
        },
        validators: {
            onChange: ({ value }) => {
                const result = formSchema.safeParse(value);
                if (!result.success) {
                    return result.error.issues[0]?.message;
                }
                if (value.slug !== activeOrganization?.slug) {
                    return t`Slug does not match`;
                }
                return undefined;
            },
        },
        onSubmit: async ({ value }) => {
            if (!activeOrganization) return;

            try {
                await authClient.organization.delete({
                    organizationId: activeOrganization.id,
                    fetchOptions: {
                        throw: true,
                    },
                });

                await refetchOrganizations?.();
                await refetchActiveOrganization?.();

                toast({
                    variant: "success",
                    message: t`Organization deleted successfully`,
                });
                navigate(redirectTo);
                onOpenChange?.(false);
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error }),
                });
            }
        },
    });

    const isSubmitting = form.state.isSubmitting;

    return (
        <Dialog onOpenChange={onOpenChange} {...props}>
            <DialogContent className={cn("sm:max-w-md", classNames?.dialog?.content)}>
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>{t`Delete Organization`}</DialogTitle>

                    <DialogDescription className={cn("text-xs md:text-sm", classNames?.description)}>
                        {t`This action cannot be undone. This will permanently delete the organization and all associated data.`}
                    </DialogDescription>
                </DialogHeader>

                <Card className={cn("my-2 flex-row p-4", classNames?.cell)}>
                    <OrganizationView organization={activeOrganization} />
                </Card>

                <form.AppForm>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                        className="grid gap-6"
                    >
                        <form.AppField
                            name="slug"
                            children={(field) => (
                                <field.FormItem>
                                    <field.FormLabel className={classNames?.label}>
                                        {t`Please type`} <span className="font-bold">{activeOrganization?.slug}</span> {t`to confirm`}
                                    </field.FormLabel>

                                    <field.FormControl>
                                        <Input
                                            placeholder={activeOrganization?.slug}
                                            className={classNames?.input}
                                            autoComplete="off"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                        />
                                    </field.FormControl>

                                    <field.FormMessage className={classNames?.error} />
                                </field.FormItem>
                            )}
                        />

                        <DialogFooter className={classNames?.dialog?.footer}>
                            <Button
                                type="button"
                                variant="secondary"
                                className={cn(classNames?.button, classNames?.secondaryButton)}
                                onClick={() => onOpenChange?.(false)}
                            >
                                {t`Cancel`}
                            </Button>

                            <form.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                                children={([canSubmit, isSubmitting]) => (
                                    <Button
                                        className={cn(classNames?.button, classNames?.destructiveButton)}
                                        disabled={!canSubmit || isSubmitting}
                                        variant="destructive"
                                        type="submit"
                                    >
                                        {isSubmitting && <Loader2 className="animate-spin" />}
                                        {t`Delete Organization`}
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
