"use client";
import { Loader2 } from "lucide-react";
import { useContext, useEffect } from "react";
import * as z from "zod";

import { useOnSuccessTransition } from "../../../hooks/use-success-transition";
import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { getLocalizedError } from "../../../lib/utils";
import type { AuthLocalization } from "../../../localization/auth-localization";
import { Button } from "@/components/ui/button";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { AuthFormClassNames } from "../auth-form";

export interface RecoverAccountFormProps {
    className?: string;
    classNames?: AuthFormClassNames;
    isSubmitting?: boolean;
    localization: Partial<AuthLocalization>;
    redirectTo?: string;
    setIsSubmitting?: (value: boolean) => void;
}

const formSchema = z.object({
    code: z.string().min(1, { message: "Backup code is required" }),
});

export function RecoverAccountForm({ className, classNames, isSubmitting, localization, redirectTo, setIsSubmitting }: RecoverAccountFormProps) {
    const { authClient, localization: contextLocalization, toast } = useContext(AuthUIContext);

    localization = { ...contextLocalization, ...localization };

    const { onSuccess, isPending: transitionPending } = useOnSuccessTransition({
        redirectTo,
    });

    const form = useAppForm({
        defaultValues: {
            code: "",
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
            try {
                await authClient.twoFactor.verifyBackupCode({
                    code: value.code,
                    fetchOptions: { throw: true },
                });

                await onSuccess();
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error, localization }),
                });

                form.reset();
            }
        },
    });

    isSubmitting = isSubmitting || form.state.isSubmitting || transitionPending;

    useEffect(() => {
        setIsSubmitting?.(form.state.isSubmitting || transitionPending);
    }, [form.state.isSubmitting, transitionPending, setIsSubmitting]);

    return (
        <form.AppForm>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
                className={cn("grid gap-6", className, classNames?.base)}
            >
                <form.AppField
                    name="code"
                    children={(field) => (
                        <field.FormItem>
                            <field.FormLabel className={classNames?.label}>{localization.BACKUP_CODE}</field.FormLabel>

                            <field.FormControl>
                                <Input
                                    placeholder={localization.BACKUP_CODE_PLACEHOLDER}
                                    autoComplete="off"
                                    className={classNames?.input}
                                    disabled={isSubmitting}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                            </field.FormControl>

                            <field.FormMessage className={classNames?.error} />
                        </field.FormItem>
                    )}
                />

                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isSubmitting]) => (
                        <Button type="submit" disabled={!canSubmit || isSubmitting} className={cn(classNames?.button, classNames?.primaryButton)}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : localization.RECOVER_ACCOUNT_ACTION}
                        </Button>
                    )}
                />
            </form>
        </form.AppForm>
    );
}
