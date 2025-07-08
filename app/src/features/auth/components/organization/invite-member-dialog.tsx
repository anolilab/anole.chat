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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface InviteMemberDialogProps extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames;
}

export function InviteMemberDialog({ classNames, onOpenChange, ...props }: InviteMemberDialogProps) {
    const {
        authClient,
        hooks: { useActiveOrganization, useSession },
        toast,
        organization,
    } = useContext(AuthUIContext);

    const { data: activeOrganization, refetch: refetchActiveOrganization } = useActiveOrganization();
    const { data: sessionData } = useSession();
    const membership = activeOrganization?.members.find((m) => m.userId === sessionData?.user.id);

    const builtInRoles = [
        { role: "owner", label: t`Owner` },
        { role: "admin", label: t`Admin` },
        { role: "member", label: t`Member` },
    ] as const;

    const roles = [...builtInRoles, ...(organization?.customRoles || [])];
    const availableRoles = roles.filter((role) => membership?.role === "owner" || role.role !== "owner");

    const formSchema = z.object({
        email: z
            .string()
            .min(1, { message: t`Email is required` })
            .email({
                message: t`Invalid email`,
            }),
        role: z.string().min(1, {
            message: t`Role is required`,
        }),
    });

    const form = useAppForm({
        defaultValues: {
            email: "",
            role: "member",
        },
        validators: {
            onChange: ({ value }) => formSchema.safeParse(value),
        },
        onSubmit: async ({ value }) => {
            try {
                await authClient.organization.inviteMember({
                    email: value.email,
                    role: value.role as (typeof builtInRoles)[number]["role"],
                    organizationId: activeOrganization?.id,
                    fetchOptions: { throw: true },
                });

                await refetchActiveOrganization?.();

                onOpenChange?.(false);
                form.reset();

                toast({
                    variant: "success",
                    message: t`Invitation sent successfully`,
                });
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error }),
                });
            }
        },
    });

    return (
        <Dialog onOpenChange={onOpenChange} {...props}>
            <DialogContent className={classNames?.dialog?.content}>
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>{t`Invite Member`}</DialogTitle>

                    <DialogDescription className={cn("text-xs md:text-sm", classNames?.description)}>
                        {t`Invite a new member to join your organization`}
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
                        <form.AppField
                            name="email"
                            children={(field) => (
                                <field.FormItem>
                                    <field.FormLabel className={classNames?.label}>{t`Email`}</field.FormLabel>

                                    <field.FormControl>
                                        <Input
                                            placeholder={t`Enter email address`}
                                            type="email"
                                            autoComplete="email"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className={classNames?.input}
                                        />
                                    </field.FormControl>

                                    <field.FormMessage />
                                </field.FormItem>
                            )}
                        />

                        <form.AppField
                            name="role"
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
                        />

                        <DialogFooter className={classNames?.dialog?.footer}>
                            <form.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                                children={([canSubmit, isSubmitting]) => (
                                    <Button type="submit" disabled={!canSubmit} className={classNames?.button}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t`Send Invitation`}
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
