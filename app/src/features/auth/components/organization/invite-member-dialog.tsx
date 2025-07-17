"use client";

import { Button } from "@anole/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@anole/ui/components/dialog";
import { useAppForm } from "@anole/ui/components/form";
import { Input } from "@anole/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@anole/ui/components/select";
import cn from "@anole/ui/utils/cn";
import { t } from "@lingui/core/macro";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { z } from "zod/v4";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import { getLocalizedError } from "../../lib/utils";
import type { SettingsCardClassNames } from "../settings/shared/settings-card";

export interface InviteMemberDialogProperties extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames;
}

export const InviteMemberDialog = ({ classNames, onOpenChange, ...properties }: InviteMemberDialogProperties) => {
    const {
        authClient,
        hooks: { useActiveOrganization, useSession },
        organization,
        toast,
    } = useAuth();

    const { data: activeOrganization, refetch: refetchActiveOrganization } = useActiveOrganization();
    const { data: sessionData } = useSession();
    const membership = activeOrganization?.members.find((m) => m.userId === sessionData?.user.id);

    const builtInRoles = [
        { label: t`Owner`, role: "owner" },
        { label: t`Admin`, role: "admin" },
        { label: t`Member`, role: "member" },
    ] as const;

    const roles = [...builtInRoles, ...(organization?.customRoles || [])];
    const availableRoles = roles.filter((role) => membership?.role === "owner" || role.role !== "owner");

    const formSchema = z
        .object({
            email: z
                .string()
                .min(1, { message: t`Email is required` })
                .email({
                    message: t`Invalid email`,
                }),
            role: z.string().min(1, {
                message: t`Role is required`,
            }),
        })
        .strict();

    const form = useAppForm({
        defaultValues: {
            email: "",
            role: "member",
        },
        onSubmit: async ({ value }) => {
            try {
                await authClient.organization.inviteMember({
                    email: value.email,
                    fetchOptions: { throw: true },
                    organizationId: activeOrganization?.id,
                    role: value.role as (typeof builtInRoles)[number]["role"],
                });

                await refetchActiveOrganization?.();

                onOpenChange?.(false);
                form.reset();

                toast({
                    message: t`Invitation sent successfully`,
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
            onChange: ({ value }) => formSchema.safeParse(value),
        },
    });

    return (
        <Dialog onOpenChange={onOpenChange} {...properties}>
            <DialogContent className={classNames?.dialog?.content}>
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>{t`Invite Member`}</DialogTitle>

                    <DialogDescription className={cn("text-xs md:text-sm", classNames?.description)}>
                        {t`Invite a new member to join your organization`}
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
                        <form.AppField
                            children={(field) => (
                                <field.FormItem>
                                    <field.FormLabel className={classNames?.label}>{t`Email`}</field.FormLabel>

                                    <field.FormControl>
                                        <Input
                                            autoComplete="email"
                                            className={classNames?.input}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => {
                                                field.handleChange(e.target.value);
                                            }}
                                            placeholder={t`Enter email address`}
                                            type="email"
                                            value={field.state.value}
                                        />
                                    </field.FormControl>

                                    <field.FormMessage />
                                </field.FormItem>
                            )}
                            name="email"
                        />

                        <form.AppField
                            children={(field) => (
                                <field.FormItem>
                                    <field.FormLabel className={classNames?.label}>{t`Role`}</field.FormLabel>

                                    <Select onValueChange={field.handleChange} value={field.state.value}>
                                        <field.FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </field.FormControl>

                                        <SelectContent>
                                            {availableRoles.map((role) => (
                                                <SelectItem key={role.role} value={role.role}>
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <field.FormMessage />
                                </field.FormItem>
                            )}
                            name="role"
                        />

                        <DialogFooter className={classNames?.dialog?.footer}>
                            <form.Subscribe
                                children={([canSubmit, isSubmitting]) => (
                                    <Button className={classNames?.button} disabled={!canSubmit} type="submit">
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t`Send Invitation`}
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
