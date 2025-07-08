"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { SettingsCardFooter } from "./settings-card-footer";
import { SettingsCardHeader } from "./settings-card-header";

export type SettingsCardClassNames = {
    base?: string;
    button?: string;
    cell?: string;
    checkbox?: string;
    destructiveButton?: string;
    content?: string;
    description?: string;
    dialog?: {
        content?: string;
        footer?: string;
        header?: string;
    };
    footer?: string;
    error?: string;
    header?: string;
    icon?: string;
    input?: string;
    instructions?: string;
    label?: string;
    primaryButton?: string;
    secondaryButton?: string;
    outlineButton?: string;
    skeleton?: string;
    title?: string;
};

export interface SettingsCardProps extends Omit<ComponentProps<typeof Card>, "title"> {
    children?: ReactNode;
    className?: string;
    classNames?: SettingsCardClassNames;
    title?: ReactNode;
    header?: ReactNode;
    description?: ReactNode;
    instructions?: ReactNode;
    actionLabel?: ReactNode;
    isSubmitting?: boolean;
    disabled?: boolean;
    isPending?: boolean;
    optimistic?: boolean;
    variant?: "default" | "destructive";
    action?: () => Promise<unknown> | unknown;
}

export function SettingsCard({
    children,
    className,
    classNames,
    title,
    header,
    description,
    instructions,
    actionLabel,
    disabled,
    isPending,
    isSubmitting,
    optimistic,
    variant,
    action,
    ...props
}: SettingsCardProps) {
    const displayTitle = header || title;

    return (
        <Card className={cn("w-full pb-0 text-start", variant === "destructive" && "border-destructive/40", className, classNames?.base)} {...props}>
            <SettingsCardHeader classNames={classNames} description={description} isPending={isPending} title={displayTitle} />

            {children}

            {(actionLabel || action) && (
                <SettingsCardFooter
                    classNames={classNames}
                    actionLabel={actionLabel}
                    disabled={disabled}
                    isPending={isPending}
                    isSubmitting={isSubmitting}
                    instructions={instructions}
                    optimistic={optimistic}
                    variant={variant}
                    action={action}
                />
            )}
        </Card>
    );
}
