"use client";

import { t } from "@lingui/core/macro";
import type { ReactNode } from "react";
import { use } from "react";
import { z } from "zod/v4";

import { CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import { getLocalizedError } from "../../../lib/utils";
import type { FieldType } from "../../../types/form-validation-types";
import type { SettingsCardClassNames } from "../shared/settings-card";
import { SettingsCard } from "../shared/settings-card";

export interface UpdateFieldCardProperties {
    className?: string;
    classNames?: SettingsCardClassNames;
    description?: ReactNode;
    instructions?: ReactNode;

    label?: ReactNode;
    name: string;
    placeholder?: string;
    required?: boolean;
    type?: FieldType;
    validate?: (value: string) => boolean | Promise<boolean>;
    value?: unknown;
}

export const UpdateFieldCard = ({
    className,
    classNames,
    description,
    instructions,
    label,
    name,
    placeholder,
    required,
    type,
    validate,
    value,
}: UpdateFieldCardProperties) => {
    const {
        hooks: { useSession },
        mutators: { updateUser },
        optimistic,
        toast,
    } = useAuth();

    const { isPending, refetch } = useSession();

    // Create the appropriate schema based on type
    let fieldSchema = z.unknown() as z.ZodType;

    if (type === "number") {
        fieldSchema = required
            ? z.preprocess(
                (value_) => (value_ ? Number(value_) : undefined),
                z.number({
                    invalid_type_error: `${label} ${t`is invalid`}`,
                    required_error: `${label} ${t`is required`}`,
                }),
            )
            : z.coerce
                .number({
                    invalid_type_error: `${label} ${t`is invalid`}`,
                })
                .optional();
    } else if (type === "boolean") {
        fieldSchema = required
            ? z.coerce
                .boolean({
                    invalid_type_error: `${label} ${t`is invalid`}`,
                    required_error: `${label} ${t`is required`}`,
                })
                .refine((value_) => value_, {
                    message: `${label} ${t`is required`}`,
                })
            : z.coerce.boolean({
                invalid_type_error: `${label} ${t`is invalid`}`,
            });
    } else {
        fieldSchema = required ? z.string().min(1, `${label} ${t`is required`}`) : z.string().optional();
    }

    const form = useAppForm({
        defaultValues: {
            [name]: value || "",
        },
        onSubmit: async ({ value: values }) => {
            await new Promise((resolve) => setTimeout(resolve));
            const newValue = values[name];

            if (value === newValue) {
                toast({
                    message: `${label} ${t`is the same as current value`}`,
                    variant: "error",
                });

                return;
            }

            if (validate && typeof newValue === "string" && !await validate(newValue)) {
                form.setErrorMap({
                    [name]: `${label} ${t`is invalid`}`,
                });

                return;
            }

            try {
                await updateUser({ [name]: newValue });

                await refetch?.();
                toast({
                    message: `${label} ${t`updated successfully`}`,
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
                const result = fieldSchema.safeParse(value[name]);

                if (!result.success) {
                    return { [name]: result.error.issues[0]?.message };
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
                    description={description}
                    instructions={instructions}
                    isPending={isPending}
                    optimistic={optimistic}
                    title={label}
                >
                    <CardContent className={classNames?.content}>
                        {type === "boolean"
                            ? (
                                <form.AppField
                                    children={(field) => (
                                        <field.FormItem className="flex">
                                            <field.FormControl>
                                                <Checkbox
                                                    checked={field.state.value as boolean}
                                                    className={classNames?.checkbox}
                                                    disabled={isSubmitting}
                                                    onCheckedChange={(checked) => { field.handleChange(checked as boolean); }}
                                                />
                                            </field.FormControl>

                                            <field.FormLabel className={classNames?.label}>{label}</field.FormLabel>

                                            <field.FormMessage className={classNames?.error} />
                                        </field.FormItem>
                                    )}
                                    name={name}
                                />
                            )
                            : isPending
                                ? (
                                    <Skeleton className={cn("h-9 w-full", classNames?.skeleton)} />
                                )
                                : (
                                    <form.AppField
                                        children={(field) => (
                                            <field.FormItem>
                                                <field.FormControl>
                                                    <Input
                                                        autoComplete={name === "name" ? "name" : name === "username" ? "username" : "off"}
                                                        className={classNames?.input}
                                                        disabled={isSubmitting}
                                                        onBlur={field.handleBlur}
                                                        onChange={(e) => { field.handleChange(e.target.value); }}
                                                        placeholder={placeholder}
                                                        type={type === "number" ? "number" : "text"}
                                                        value={field.state.value as string}
                                                    />
                                                </field.FormControl>

                                                <field.FormMessage className={classNames?.error} />
                                            </field.FormItem>
                                        )}
                                        name={name}
                                    />
                                )}
                    </CardContent>
                </SettingsCard>
            </form>
        </form.AppForm>
    );
};
