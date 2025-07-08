"use client";

import { Loader2 } from "lucide-react";
import { type ComponentProps, useContext, useState } from "react";
import { z } from "zod/v4";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { PasswordInput } from "../../password-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppForm } from "@/components/ui/form";
import type { SettingsCardClassNames } from "../shared/settings-card";
import { BackupCodesDialog } from "./backup-codes-dialog";
import { getLocalizedError } from "@/features/auth/lib/utils";

interface TwoFactorPasswordDialogProps extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames;
    isTwoFactorEnabled: boolean;
}

const formSchema = z.object({
    password: z.string().min(1, { message: "Password is required" }),
});

export function TwoFactorPasswordDialog({ classNames, onOpenChange, isTwoFactorEnabled, ...props }: TwoFactorPasswordDialogProps) {
    const { authClient, basePath, viewPaths, navigate, toast, twoFactor } = useContext(AuthUIContext);
    const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [totpURI, setTotpURI] = useState<string | null>(null);

    const form = useAppForm({
        defaultValues: {
            password: "",
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
        onSubmit: async ({ value }) => {
            if (isTwoFactorEnabled) {
                await disableTwoFactor(value);
            } else {
                await enableTwoFactor(value);
            }
        },
    });

    async function enableTwoFactor({ password }: z.infer<typeof formSchema>) {
        try {
            const response = await authClient.twoFactor.enable({
                password,
                fetchOptions: { throw: true },
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
                variant: "error",
                message: getLocalizedError({ error }),
            });
        }
    }

    async function disableTwoFactor({ password }: z.infer<typeof formSchema>) {
        try {
            await authClient.twoFactor.disable({
                password,
                fetchOptions: { throw: true },
            });

            toast({
                variant: "success",
                message: t`Two-factor authentication disabled`,
            });

            onOpenChange?.(false);
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error }),
            });
        }
    }

    const isSubmitting = form.state.isSubmitting;

    return (
        <>
            <Dialog onOpenChange={onOpenChange} {...props}>
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
                            onSubmit={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                form.handleSubmit();
                            }}
                            className="grid gap-4"
                        >
                            <form.AppField
                                name="password"
                                children={(field) => (
                                    <field.FormItem>
                                        <field.FormLabel className={classNames?.label}>{t`Password`}</field.FormLabel>

                                        <field.FormControl>
                                            <PasswordInput
                                                className={classNames?.input}
                                                placeholder={t`Enter your password`}
                                                autoComplete="current-password"
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
                                    onClick={() => onOpenChange?.(false)}
                                    className={cn(classNames?.button, classNames?.secondaryButton)}
                                >
                                    {t`Cancel`}
                                </Button>

                                <form.Subscribe
                                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                                    children={([canSubmit, isSubmitting]) => (
                                        <Button
                                            type="submit"
                                            disabled={!canSubmit || isSubmitting}
                                            className={cn(classNames?.button, classNames?.primaryButton)}
                                        >
                                            {isSubmitting && <Loader2 className="animate-spin" />}
                                            {isTwoFactorEnabled ? t`Disable Two-Factor` : t`Enable Two-Factor`}
                                        </Button>
                                    )}
                                />
                            </DialogFooter>
                        </form>
                    </form.AppForm>
                </DialogContent>
            </Dialog>

            <BackupCodesDialog
                open={showBackupCodesDialog}
                onOpenChange={(open) => {
                    setShowBackupCodesDialog(open);

                    if (!open) {
                        const url = `${basePath}/${viewPaths.TWO_FACTOR}`;
                        navigate(twoFactor?.includes("totp") && totpURI ? `${url}?totpURI=${totpURI}&hideForgotAuthenticator=true` : url);
                    }
                }}
                backupCodes={backupCodes}
                classNames={classNames}
            />
        </>
    );
}
