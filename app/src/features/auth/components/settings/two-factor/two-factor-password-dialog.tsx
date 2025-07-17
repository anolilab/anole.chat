"use client";

import { Button } from "@anole/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@anole/ui/components/dialog";
import { useAppForm } from "@anole/ui/components/form";
import cn from "@anole/ui/utils/cn";
import { t } from "@lingui/core/macro";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { use, useState } from "react";
import { z } from "zod/v4";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { getLocalizedError } from "@/features/auth/lib/utils";

import { PasswordInput } from "../../../../../components/form/password-input";
import type { SettingsCardClassNames } from "../shared/settings-card";
import { BackupCodesDialog } from "./backup-codes-dialog";

interface TwoFactorPasswordDialogProperties extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames;
    isTwoFactorEnabled: boolean;
}

const formSchema = z
    .object({
        password: z.string().min(1, { message: "Password is required" }),
    })
    .strict();

export const TwoFactorPasswordDialog = ({ classNames, isTwoFactorEnabled, onOpenChange, ...properties }: TwoFactorPasswordDialogProperties) => {
    const { authClient, basePath, navigate, toast, twoFactor, viewPaths } = useAuth();
    const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [totpURI, setTotpURI] = useState<string | null>(null);

    const form = useAppForm({
        defaultValues: {
            password: "",
        },
        onSubmit: async ({ value }) => {
            await (isTwoFactorEnabled ? disableTwoFactor(value) : enableTwoFactor(value));
        },
        validators: {
            onChange: ({ value }) => {
                const result = formSchema.safeParse(value);

                if (!result.success) {
                    return { password: result.error.issues[0]?.message };
                }

                return undefined;
            },
        },
    });

    async function enableTwoFactor({ password }: z.infer<typeof formSchema>) {
        try {
            const response = await authClient.twoFactor.enable({
                fetchOptions: { throw: true },
                password,
            });

            onOpenChange?.(false);
            setBackupCodes(response.backupCodes);

            if (twoFactor?.includes("totp")) {
                setTotpURI(response.totpURI);
            }

            setTimeout(() => {
                setShowBackupCodesDialog(true);
            }, 250);
        } catch (error) {
            toast({
                message: getLocalizedError({ error }),
                variant: "error",
            });
        }
    }

    async function disableTwoFactor({ password }: z.infer<typeof formSchema>) {
        try {
            await authClient.twoFactor.disable({
                fetchOptions: { throw: true },
                password,
            });

            toast({
                message: t`Two-factor authentication disabled`,
                variant: "success",
            });

            onOpenChange?.(false);
        } catch (error) {
            toast({
                message: getLocalizedError({ error }),
                variant: "error",
            });
        }
    }

    const { isSubmitting } = form.state;

    return (
        <>
            <Dialog onOpenChange={onOpenChange} {...properties}>
                <DialogContent className={cn("sm:max-w-md", classNames?.dialog)}>
                    <DialogHeader className={classNames?.dialog?.header}>
                        <DialogTitle className={classNames?.title}>{t`Two-Factor Authentication`}</DialogTitle>

                        <DialogDescription className={classNames?.description}>
                            {isTwoFactorEnabled
                                ? t`Enter your password to disable two-factor authentication`
                                : t`Enter your password to enable two-factor authentication`}
                        </DialogDescription>
                    </DialogHeader>

                    <form.AppForm>
                        <form
                            className="grid gap-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                form.handleSubmit();
                            }}
                        >
                            <form.AppField
                                children={(field) => (
                                    <field.FormItem>
                                        <field.FormLabel className={classNames?.label}>{t`Password`}</field.FormLabel>

                                        <field.FormControl>
                                            <PasswordInput
                                                autoComplete="current-password"
                                                className={classNames?.input}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => {
                                                    field.handleChange(e.target.value);
                                                }}
                                                placeholder={t`Enter your password`}
                                                value={field.state.value}
                                            />
                                        </field.FormControl>

                                        <field.FormMessage className={classNames?.error} />
                                    </field.FormItem>
                                )}
                                name="password"
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
                                            className={cn(classNames?.button, classNames?.primaryButton)}
                                            disabled={!canSubmit || isSubmitting}
                                            type="submit"
                                        >
                                            {isSubmitting && <Loader2 className="animate-spin" />}
                                            {isTwoFactorEnabled ? t`Disable Two-Factor` : t`Enable Two-Factor`}
                                        </Button>
                                    )}
                                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                                />
                            </DialogFooter>
                        </form>
                    </form.AppForm>
                </DialogContent>
            </Dialog>

            <BackupCodesDialog
                backupCodes={backupCodes}
                classNames={classNames}
                onOpenChange={(open) => {
                    setShowBackupCodesDialog(open);

                    if (!open) {
                        const url = `${basePath}/${viewPaths.TWO_FACTOR}`;

                        navigate(twoFactor?.includes("totp") && totpURI ? `${url}?totpURI=${totpURI}&hideForgotAuthenticator=true` : url);
                    }
                }}
                open={showBackupCodesDialog}
            />
        </>
    );
};
