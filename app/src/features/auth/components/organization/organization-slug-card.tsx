"use client";

import { useContext } from "react";
import * as z from "zod";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { getLocalizedError } from "../../lib/utils";
import { SettingsCard, type SettingsCardProps } from "../settings/shared/settings-card";
import { CardContent } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export function OrganizationSlugCard({ className, classNames, ...props }: SettingsCardProps) {
    const {
        hooks: { useActiveOrganization },
    } = useContext(AuthUIContext);

    const { data: activeOrganization } = useActiveOrganization();

    if (!activeOrganization) {
        return (
            <SettingsCard
                className={className}
                classNames={classNames}
                description={t`Change your organization's unique identifier`}
                instructions={t`This is your organization's URL namespace`}
                isPending
                title={t`Organization Slug`}
                actionLabel={t`Save`}
                optimistic={props.optimistic}
                {...props}
            >
                <CardContent className={classNames?.content}>
                    <Skeleton className={cn("h-9 w-full", classNames?.skeleton)} />
                </CardContent>
            </SettingsCard>
        );
    }

    return <OrganizationSlugForm className={className} classNames={classNames} {...props} />;
}

const formSchema = z.object({
    slug: z
        .string()
        .min(1, { message: t`Organization slug is required` })
        .regex(/^[a-z0-9-]+$/, { message: t`Organization slug is invalid` }),
});

function OrganizationSlugForm({ className, classNames, ...props }: SettingsCardProps) {
    const {
        authClient,
        hooks: { useActiveOrganization, useListOrganizations, useHasPermission },
        optimistic,
        toast,
    } = useContext(AuthUIContext);

    const { data: activeOrganization, refetch: refetchActiveOrganization } = useActiveOrganization();
    const { refetch: refetchOrganizations } = useListOrganizations();
    const { data: hasPermission, isPending } = useHasPermission({
        permissions: {
            organization: ["update"],
        },
    });

    const form = useAppForm({
        defaultValues: {
            slug: activeOrganization?.slug || "",
        },
        validators: {
            onChange: ({ value }) => {
                const result = formSchema.safeParse(value);
                if (!result.success) {
                    return result.error.issues[0]?.message;
                }
                return undefined;
            },
        },
        onSubmit: async ({ value }) => {
            if (!activeOrganization) return;

            if (activeOrganization.slug === value.slug) {
                toast({
                    variant: "error",
                    message: t`Organization slug is the same`,
                });
                return;
            }

            try {
                await authClient.organization.update({
                    data: { slug: value.slug },
                    fetchOptions: {
                        throw: true,
                    },
                });

                await refetchActiveOrganization?.();
                await refetchOrganizations?.();

                toast({
                    variant: "success",
                    message: t`Organization slug updated successfully`,
                });
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
        <form.AppForm>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <SettingsCard
                    className={className}
                    classNames={classNames}
                    description={t`Change your organization's unique identifier`}
                    instructions={t`This is your organization's URL namespace`}
                    isPending={isPending}
                    title={t`Organization Slug`}
                    actionLabel={t`Save`}
                    optimistic={optimistic}
                    disabled={!hasPermission?.success}
                    {...props}
                >
                    <CardContent className={classNames?.content}>
                        {isPending ? (
                            <Skeleton className={cn("h-9 w-full", classNames?.skeleton)} />
                        ) : (
                            <form.AppField
                                name="slug"
                                children={(field) => (
                                    <field.FormItem>
                                        <field.FormControl>
                                            <Input
                                                className={classNames?.input}
                                                placeholder={t`Enter organization slug`}
                                                disabled={isSubmitting || !hasPermission?.success}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                            />
                                        </field.FormControl>

                                        <field.FormMessage className={classNames?.error} />
                                    </field.FormItem>
                                )}
                            />
                        )}
                    </CardContent>
                </SettingsCard>
            </form>
        </form.AppForm>
    );
}
