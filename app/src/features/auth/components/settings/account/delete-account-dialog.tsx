import { Loader2 } from "lucide-react";
import { type ComponentProps, useContext } from "react";
import * as z from "zod";
import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { getLocalizedError } from "../../../lib/utils";
import { cn } from "@/lib/utils";
import type { AuthLocalization } from "../../../localization/auth-localization";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserView } from "../../user-view";
import type { SettingsCardClassNames } from "../shared/settings-card";

export interface DeleteAccountDialogProps extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames;
    accounts?: { provider: string }[] | null;
    localization?: AuthLocalization;
}

const formSchema = z.object({
    password: z.string().optional(),
});

export function DeleteAccountDialog({ classNames, accounts, localization, onOpenChange, ...props }: DeleteAccountDialogProps) {
    const {
        authClient,
        basePath,
        baseURL,
        deleteUser,
        freshAge,
        hooks: { useSession },
        localization: contextLocalization,
        viewPaths,
        navigate,
        toast,
    } = useContext(AuthUIContext);

    localization = { ...contextLocalization, ...localization };

    const { data: sessionData } = useSession();
    const session = sessionData?.session;
    const user = sessionData?.user;

    const isFresh = session ? Date.now() - session?.createdAt.getTime() < freshAge * 1000 : false;
    const credentialsLinked = accounts?.some((acc) => acc.provider === "credential");

    const form = useAppForm({
        defaultValues: {
            password: "",
        },
        validators: {
            onChange: ({ value }) => {
                if (credentialsLinked && !value.password) {
                    return { password: localization.PASSWORD_REQUIRED! };
                }
                return undefined;
            },
        },
        onSubmit: async ({ value }) => {
            const params = {} as Record<string, string>;

            if (credentialsLinked) {
                params.password = value.password!;
            } else if (!isFresh) {
                navigate(`${basePath}/${viewPaths.SIGN_OUT}`);
                return;
            }

            if (deleteUser?.verification) {
                params.callbackURL = `${baseURL}${basePath}/${viewPaths.SIGN_OUT}`;
            }

            try {
                await authClient.deleteUser({
                    ...params,
                    fetchOptions: {
                        throw: true,
                    },
                });

                if (deleteUser?.verification) {
                    toast({
                        variant: "success",
                        message: localization.DELETE_ACCOUNT_VERIFY!,
                    });
                } else {
                    toast({
                        variant: "success",
                        message: localization.DELETE_ACCOUNT_SUCCESS!,
                    });
                    navigate(`${basePath}/${viewPaths.SIGN_OUT}`);
                }
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error, localization }),
                });
            }

            onOpenChange?.(false);
        },
    });

    return (
        <Dialog onOpenChange={onOpenChange} {...props}>
            <DialogContent className={cn("sm:max-w-md", classNames?.dialog?.content)}>
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle className={cn("text-lg md:text-xl", classNames?.title)}>{localization?.DELETE_ACCOUNT}</DialogTitle>

                    <DialogDescription className={cn("text-xs md:text-sm", classNames?.description)}>
                        {isFresh ? localization?.DELETE_ACCOUNT_INSTRUCTIONS : localization?.SESSION_NOT_FRESH}
                    </DialogDescription>
                </DialogHeader>

                <Card className={cn("my-2 flex-row p-4", classNames?.cell)}>
                    <UserView user={user} localization={localization} />
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
                        {credentialsLinked && (
                            <form.AppField
                                name="password"
                                children={(field) => (
                                    <field.FormItem>
                                        <field.FormLabel className={classNames?.label}>{localization?.PASSWORD}</field.FormLabel>

                                        <field.FormControl>
                                            <Input
                                                autoComplete="current-password"
                                                placeholder={localization?.PASSWORD_PLACEHOLDER}
                                                type="password"
                                                className={classNames?.input}
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

                        <DialogFooter className={classNames?.dialog?.footer}>
                            <Button
                                type="button"
                                variant="secondary"
                                className={cn(classNames?.button, classNames?.secondaryButton)}
                                onClick={() => onOpenChange?.(false)}
                            >
                                {localization.CANCEL}
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
                                        {isFresh ? localization?.DELETE_ACCOUNT : localization?.SIGN_OUT}
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
