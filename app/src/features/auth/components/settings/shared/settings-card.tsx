"use client";

import { Card } from "@anole/ui/components/card";
import cn from "@anole/ui/utils/cn";
import type { ComponentProps, ReactNode } from "react";

import { SettingsCardFooter } from "./settings-card-footer";
import { SettingsCardHeader } from "./settings-card-header";

export type SettingsCardClassNames = {
    base?: string;
    button?: string;
    cell?: string;
    checkbox?: string;
    content?: string;
    description?: string;
    destructiveButton?: string;
    dialog?: {
        content?: string;
        footer?: string;
        header?: string;
    };
    error?: string;
    footer?: string;
    header?: string;
    icon?: string;
    input?: string;
    instructions?: string;
    label?: string;
    outlineButton?: string;
    primaryButton?: string;
    secondaryButton?: string;
    skeleton?: string;
    title?: string;
};

export interface SettingsCardProperties extends Omit<ComponentProps<typeof Card>, "title"> {
    action?: () => Promise<unknown> | unknown;
    actionLabel?: ReactNode;
    children?: ReactNode;
    className?: string;
    classNames?: SettingsCardClassNames;
    description?: ReactNode;
    disabled?: boolean;
    header?: ReactNode;
    instructions?: ReactNode;
    isPending?: boolean;
    isSubmitting?: boolean;
    optimistic?: boolean;
    title?: ReactNode;
    variant?: "default" | "destructive";
}

export const SettingsCard = ({
    action,
    actionLabel,
    children,
    className,
    classNames,
    description,
    disabled,
    header,
    instructions,
    isPending,
    isSubmitting,
    optimistic,
    title,
    variant,
    ...properties
}: SettingsCardProperties) => {
    const displayTitle = header || title;

    return (
        <Card className={cn("w-full pb-0 text-start", variant === "destructive" && "border-destructive/40", className, classNames?.base)} {...properties}>
            <SettingsCardHeader classNames={classNames} description={description} isPending={isPending} title={displayTitle} />

            {children}

            {(actionLabel || action) && (
                <SettingsCardFooter
                    action={action}
                    actionLabel={actionLabel}
                    classNames={classNames}
                    disabled={disabled}
                    instructions={instructions}
                    isPending={isPending}
                    isSubmitting={isSubmitting}
                    optimistic={optimistic}
                    variant={variant}
                />
            )}
        </Card>
    );
};
