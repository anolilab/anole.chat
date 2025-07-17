"use client";

import { CardContent } from "@anole/ui/components/card";
import { useAppForm } from "@anole/ui/components/form";
import { Input } from "@anole/ui/components/input";
import { Skeleton } from "@anole/ui/components/skeleton";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { z } from "zod/v4";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import { getLocalizedError } from "../../lib/utils";
import type { SettingsCardProperties } from "../settings/shared/settings-card";
import { SettingsCard } from "../settings/shared/settings-card";

export const OrganizationNameCard = ({ className, classNames, ...properties }: SettingsCardProperties) => {
    const {
        hooks: { useActiveOrganization },
    } = useAuth();
    const { t } = useLingui();

    const { data: activeOrganization } = useActiveOrganization();

    if (!activeOrganization) {
        return (
            <SettingsCard
                actionLabel={t`Save`}
                className={className}
                classNames={classNames}
                description={t`Change your organization's display name`}
                instructions={t`This is how your organization appears to members`}
                isPending
                optimistic={properties.optimistic}
                title={t`Organization Name`}
                {...properties}
            >
                <CardContent className={classNames?.content}>
                    <Skeleton className={cn("h-9 w-full", classNames?.skeleton)} />
                </CardContent>
            </SettingsCard>
        );
    }

    return <OrganizationNameForm className={className} classNames={classNames} {...properties} />;
};

const OrganizationNameForm = ({ className, classNames, ...properties }: SettingsCardProperties) => {
    const {
        authClient,
        hooks: { useActiveOrganization, useHasPermission, useListOrganizations },
        optimistic,
        toast,
    } = useAuth();
    const { t } = useLingui();

    const formSchema = z
        .object({
            name: z.string().min(1, { message: t`Organization name is required` }),
        })
        .strict();

    const { data: activeOrganization, refetch: refetchActiveOrganization } = useActiveOrganization();
    const { refetch: refetchOrganizations } = useListOrganizations();
    const { data: hasPermission, isPending } = useHasPermission({
        permissions: {
            organization: ["update"],
        },
    });

    const form = useAppForm({
        defaultValues: {
            name: activeOrganization?.name || "",
        },
        onSubmit: async ({ value }) => {
            if (!activeOrganization)
                return;

            if (activeOrganization.name === value.name) {
                toast({
                    message: t`Organization name is the same`,
                    variant: "error",
                });

                return;
            }

            try {
                await authClient.organization.update({
                    data: { name: value.name },
                    fetchOptions: {
                        throw: true,
                    },
                });

                await refetchActiveOrganization?.();
                await refetchOrganizations?.();

                toast({
                    message: t`Organization name updated successfully`,
                    variant: "success",
                });
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
                    description={t`Change your organization's display name`}
                    disabled={!hasPermission?.success}
                    instructions={t`This is how your organization appears to members`}
                    isPending={isPending}
                    optimistic={optimistic}
                    title={t`Organization Name`}
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
                                                    autoComplete="organization"
                                                    className={classNames?.input}
                                                    disabled={isSubmitting || !hasPermission?.success}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => {
                                                        field.handleChange(e.target.value);
                                                    }}
                                                    placeholder={t`Enter organization name`}
                                                    value={field.state.value}
                                                />
                                            </field.FormControl>

                                            <field.FormMessage className={classNames?.error} />
                                        </field.FormItem>
                                    )}
                                    name="name"
                                />
                            )}
                    </CardContent>
                </SettingsCard>
            </form>
        </form.AppForm>
    );
};
