"use client";

import { t } from "@lingui/core/macro";
import { use } from "react";
import { z } from "zod/v4";

import { CardContent } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import { getLocalizedError } from "../../lib/utils";
import type { SettingsCardProps as SettingsCardProperties } from "../settings/shared/settings-card";
import { SettingsCard } from "../settings/shared/settings-card";

export const OrganizationSlugCard = ({ className, classNames, ...properties }: SettingsCardProperties) => {
    const {
        hooks: { useActiveOrganization },
    } = useAuth();

    const { data: activeOrganization } = useActiveOrganization();

    if (!activeOrganization) {
        return (
            <SettingsCard
                actionLabel={t`Save`}
                className={className}
                classNames={classNames}
                description={t`Change your organization's unique identifier`}
                instructions={t`This is your organization's URL namespace`}
                isPending
                optimistic={properties.optimistic}
                title={t`Organization Slug`}
                {...properties}
            >
                <CardContent className={classNames?.content}>
                    <Skeleton className={cn("h-9 w-full", classNames?.skeleton)} />
                </CardContent>
            </SettingsCard>
        );
    }

    return <OrganizationSlugForm className={className} classNames={classNames} {...properties} />;
};

const formSchema = z.object({
    slug: z
        .string()
        .min(1, { message: t`Organization slug is required` })
        .regex(/^[a-z0-9-]+$/, { message: t`Organization slug is invalid` }),
}).strict();

const OrganizationSlugForm = ({ className, classNames, ...properties }: SettingsCardProperties) => {
    const {
        authClient,
        hooks: { useActiveOrganization, useHasPermission, useListOrganizations },
        optimistic,
        toast,
    } = useAuth();

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
        onSubmit: async ({ value }) => {
            if (!activeOrganization)
                return;

            if (activeOrganization.slug === value.slug) {
                toast({
                    message: t`Organization slug is the same`,
                    variant: "error",
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
                    message: t`Organization slug updated successfully`,
                    variant: "success",
                });
            } catch (error) {
                toast({
                    message: getLocalizedError({ error }),
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

                return undefined;
            },
        },
    });

    const { isSubmitting } = form.state;

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
                    actionLabel={t`Save`}
                    className={className}
                    classNames={classNames}
                    description={t`Change your organization's unique identifier`}
                    disabled={!hasPermission?.success}
                    instructions={t`This is your organization's URL namespace`}
                    isPending={isPending}
                    optimistic={optimistic}
                    title={t`Organization Slug`}
                    {...properties}
                >
                    <CardContent className={classNames?.content}>
                        {isPending
                            ? (
                                <Skeleton className={cn("h-9 w-full", classNames?.skeleton)} />
                            )
                            : (
                                <form.AppField
                                    children={(field) => (
                                        <field.FormItem>
                                            <field.FormControl>
                                                <Input
                                                    className={classNames?.input}
                                                    disabled={isSubmitting || !hasPermission?.success}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder={t`Enter organization slug`}
                                                    value={field.state.value}
                                                />
                                            </field.FormControl>

                                            <field.FormMessage className={classNames?.error} />
                                        </field.FormItem>
                                    )}
                                    name="slug"
                                />
                            )}
                    </CardContent>
                </SettingsCard>
            </form>
        </form.AppForm>
    );
};
