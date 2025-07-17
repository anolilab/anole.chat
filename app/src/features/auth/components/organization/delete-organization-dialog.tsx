"use client";

import { Button } from "@anole/ui/components/button";
import { Card } from "@anole/ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@anole/ui/components/dialog";
import { useAppForm } from "@anole/ui/components/form";
import { Input } from "@anole/ui/components/input";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { z } from "zod/v4";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import { getLocalizedError } from "../../lib/utils";
import type { SettingsCardClassNames } from "../settings/shared/settings-card";
import { OrganizationView } from "./organization-view";

export interface DeleteOrganizationDialogProperties extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames;
}

const formSchema = z
    .object({
        slug: z.string().min(1, { message: t`Organization slug is required` }),
    })
    .strict();

export const DeleteOrganizationDialog = ({ classNames, onOpenChange, ...properties }: DeleteOrganizationDialogProperties) => {
    const {
        authClient,
        hooks: { useActiveOrganization, useListOrganizations },
        navigate,
        redirectTo,
        toast,
    } = useAuth();
    const { t } = useLingui();

    const { data: activeOrganization, refetch: refetchActiveOrganization } = useActiveOrganization();
    const { refetch: refetchOrganizations } = useListOrganizations();

    const form = useAppForm({
        defaultValues: {
            slug: "",
        },
        onSubmit: async ({ value }) => {
            if (!activeOrganization)
                return;

            try {
                await authClient.organization.delete({
                    fetchOptions: {
                        throw: true,
                    },
                    organizationId: activeOrganization.id,
                });

                await refetchOrganizations?.();
                await refetchActiveOrganization?.();

                toast({
                    message: t`Organization deleted successfully`,
                    variant: "success",
                });
                navigate(redirectTo);
                onOpenChange?.(false);
            } catch (error) {
                toast({
                    message: getLocalizedError({ error, t }),
                    variant: "error",
                });
            }
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
    });

    const { isSubmitting } = form.state;

    return (
        <Dialog onOpenChange={onOpenChange} {...properties}>
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
                        className="grid gap-6"
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                    >
                        <form.AppField
                            children={(field) => (
                                <field.FormItem>
                                    <field.FormLabel className={classNames?.label}>
                                        {t`Please type`}
                                        {" "}
                                        <span className="font-bold">{activeOrganization?.slug}</span>
                                        {" "}
                                        {t`to confirm`}
                                    </field.FormLabel>

                                    <field.FormControl>
                                        <Input
                                            autoComplete="off"
                                            className={classNames?.input}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => {
                                                field.handleChange(e.target.value);
                                            }}
                                            placeholder={activeOrganization?.slug}
                                            value={field.state.value}
                                        />
                                    </field.FormControl>

                                    <field.FormMessage className={classNames?.error} />
                                </field.FormItem>
                            )}
                            name="slug"
                        />

                        <DialogFooter className={classNames?.dialog?.footer}>
                            <Button
                                className={cn(classNames?.button, classNames?.secondaryButton)}
                                onClick={() => onOpenChange?.(false)}
                                type="button"
                                variant="secondary"
                            >
                                {t`Cancel`}
                            </Button>

                            <form.Subscribe
                                children={([canSubmit, isSubmitting]) => (
                                    <Button
                                        className={cn(classNames?.button, classNames?.destructiveButton)}
                                        disabled={!canSubmit || isSubmitting}
                                        type="submit"
                                        variant="destructive"
                                    >
                                        {isSubmitting && <Loader2 className="animate-spin" />}
                                        {t`Delete Organization`}
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
