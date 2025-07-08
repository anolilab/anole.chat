"use client";

import { type ReactNode, useContext } from "react";
import * as z from "zod";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { getLocalizedError } from "../../../lib/utils";
import { cn } from "@/lib/utils";
import type { FieldType } from "../../../types/form-validation-types";
import { CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsCard, type SettingsCardClassNames } from "../shared/settings-card";

export interface UpdateFieldCardProps {
    className?: string;
    classNames?: SettingsCardClassNames;
    description?: ReactNode;
    instructions?: ReactNode;

    name: string;
    placeholder?: string;
    required?: boolean;
    label?: ReactNode;
    type?: FieldType;
    value?: unknown;
    validate?: (value: string) => boolean | Promise<boolean>;
}

export function UpdateFieldCard({
    className,
    classNames,
    description,
    instructions,
    name,
    placeholder,
    required,
    label,
    type,
    value,
    validate,
}: UpdateFieldCardProps) {
    const {
        hooks: { useSession },
        mutators: { updateUser },
        optimistic,
        toast,
    } = useContext(AuthUIContext);

    const { isPending, refetch } = useSession();

    // Create the appropriate schema based on type
    let fieldSchema = z.unknown() as z.ZodType<unknown>;
    if (type === "number") {
        fieldSchema = required
            ? z.preprocess(
                  (val) => (!val ? undefined : Number(val)),
                  z.number({
                      required_error: `${label} ${t`is required`}`,
                      invalid_type_error: `${label} ${t`is invalid`}`,
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
                      required_error: `${label} ${t`is required`}`,
                      invalid_type_error: `${label} ${t`is invalid`}`,
                  })
                  .refine((val) => val === true, {
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
        validators: {
            onChange: ({ value }) => {
                const result = fieldSchema.safeParse(value[name]);
                if (!result.success) {
                    return { [name]: result.error.issues[0]?.message };
                }
                return undefined;
            },
        },
        onSubmit: async ({ value: values }) => {
            await new Promise((resolve) => setTimeout(resolve));
            const newValue = values[name];

            if (value === newValue) {
                toast({
                    variant: "error",
                    message: `${label} ${t`is the same as current value`}`,
                });
                return;
            }

            if (validate && typeof newValue === "string" && !(await validate(newValue))) {
                form.setErrorMap({
                    [name]: `${label} ${t`is invalid`}`,
                });
                return;
            }

            try {
                await updateUser({ [name]: newValue });

                await refetch?.();
                toast({
                    variant: "success",
                    message: `${label} ${t`updated successfully`}`,
                });
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error }),
                });
            }
        },
    });

    const isSubmitting = form.state.isSubmitting;

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
                    className={className}
                    classNames={classNames}
                    description={description}
                    instructions={instructions}
                    isPending={isPending}
                    title={label}
                    actionLabel={t`Save`}
                    optimistic={optimistic}
                >
                    <CardContent className={classNames?.content}>
                        {type === "boolean" ? (
                            <form.AppField
                                name={name}
                                children={(field) => (
                                    <field.FormItem className="flex">
                                        <field.FormControl>
                                            <Checkbox
                                                checked={field.state.value as boolean}
                                                onCheckedChange={(checked) => field.handleChange(checked as boolean)}
                                                disabled={isSubmitting}
                                                className={classNames?.checkbox}
                                            />
                                        </field.FormControl>

                                        <field.FormLabel className={classNames?.label}>{label}</field.FormLabel>

                                        <field.FormMessage className={classNames?.error} />
                                    </field.FormItem>
                                )}
                            />
                        ) : isPending ? (
                            <Skeleton className={cn("h-9 w-full", classNames?.skeleton)} />
                        ) : (
                            <form.AppField
                                name={name}
                                children={(field) => (
                                    <field.FormItem>
                                        <field.FormControl>
                                            <Input
                                                className={classNames?.input}
                                                disabled={isSubmitting}
                                                placeholder={placeholder}
                                                type={type === "number" ? "number" : "text"}
                                                autoComplete={name === "name" ? "name" : name === "username" ? "username" : "off"}
                                                value={field.state.value as string}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                            />
                                        </field.FormControl>

                                        <field.FormMessage className={classNames?.error} />
                                    </field.FormItem>
                                )}
                            />
                        )}
                    </CardContent>
                </SettingsCard>
            </form>
        </form.AppForm>
    );
}
