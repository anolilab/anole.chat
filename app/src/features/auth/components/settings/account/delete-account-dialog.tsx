import { t } from "@lingui/core/macro";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { use } from "react";
import { z } from "zod/v4";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import { getLocalizedError } from "../../../lib/utils";
import { UserView } from "../../user-view";
import type { SettingsCardClassNames } from "../shared/settings-card";

export interface DeleteAccountDialogProperties extends ComponentProps<typeof Dialog> {
    accounts?: { provider: string }[] | null;
    classNames?: SettingsCardClassNames;
}

const formSchema = z
    .object({
        password: z.string().optional(),
    })
    .strict();

export const DeleteAccountDialog = ({ accounts, classNames, onOpenChange, ...properties }: DeleteAccountDialogProperties) => {
    const {
        authClient,
        basePath,
        baseURL,
        deleteUser,
        freshAge,
        hooks: { useSession },
        navigate,
        toast,
        viewPaths,
    } = useAuth();

    const { data: sessionData } = useSession();
    const session = sessionData?.session;
    const user = sessionData?.user;

    const isFresh = session ? Date.now() - session?.createdAt.getTime() < freshAge * 1000 : false;
    const credentialsLinked = accounts?.some((accumulator) => accumulator.provider === "credential");

    const form = useAppForm({
        defaultValues: {
            password: "",
        },
        onSubmit: async ({ value }) => {
            const parameters = {} as Record<string, string>;

            if (credentialsLinked) {
                parameters.password = value.password!;
            } else if (!isFresh) {
                navigate(`${basePath}/${viewPaths.SIGN_OUT}`);

                return;
            }

            if (deleteUser?.verification) {
                parameters.callbackURL = `${baseURL}${basePath}/${viewPaths.SIGN_OUT}`;
            }

            try {
                await authClient.deleteUser({
                    ...parameters,
                    fetchOptions: {
                        throw: true,
                    },
                });

                if (deleteUser?.verification) {
                    toast({
                        message: t`Please check your email to verify account deletion`,
                        variant: "success",
                    });
                } else {
                    toast({
                        message: t`Account deleted successfully`,
                        variant: "success",
                    });
                    navigate(`${basePath}/${viewPaths.SIGN_OUT}`);
                }
            } catch (error) {
                toast({
                    message: getLocalizedError({ error }),
                    variant: "error",
                });
            }

            onOpenChange?.(false);
        },
        validators: {
            onChange: ({ value }) => {
                if (credentialsLinked && !value.password) {
                    return { password: t`Password is required` };
                }

                return undefined;
            },
        },
    });

    return (
        <Dialog onOpenChange={onOpenChange} {...properties}>
            <DialogContent className={cn("sm:max-w-md", classNames?.dialog?.content)}>
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>{t`Delete Account`}</DialogTitle>

                    <DialogDescription className={cn("text-xs md:text-sm", classNames?.description)}>
                        {isFresh
                            ? t`This action cannot be undone. Please enter your password to confirm.`
                            : t`Your session is not fresh. Please sign out and sign back in to delete your account.`}
                    </DialogDescription>
                </DialogHeader>

                <Card className={cn("my-2 flex-row p-4", classNames?.cell)}>
                    <UserView user={user} />
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
                        {credentialsLinked && (
                            <form.AppField
                                children={(field) => (
                                    <field.FormItem>
                                        <field.FormLabel className={classNames?.label}>{t`Password`}</field.FormLabel>

                                        <field.FormControl>
                                            <Input
                                                autoComplete="current-password"
                                                className={classNames?.input}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => {
                                                    field.handleChange(e.target.value);
                                                }}
                                                placeholder={t`Enter your password`}
                                                type="password"
                                                value={field.state.value}
                                            />
                                        </field.FormControl>

                                        <field.FormMessage className={classNames?.error} />
                                    </field.FormItem>
                                )}
                                name="password"
                            />
                        )}

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
                                        {isFresh ? t`Delete Account` : t`Sign Out`}
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
