"use client";

import type { ReactNode } from "react";

import { CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { SettingsActionButton } from "./settings-action-button";
import type { SettingsCardClassNames } from "./settings-card";

export interface SettingsCardFooterProperties {
    action?: () => Promise<unknown> | unknown;
    actionLabel?: ReactNode;
    className?: string;
    classNames?: SettingsCardClassNames;
    disabled?: boolean;
    instructions?: ReactNode;
    isPending?: boolean;
    isSubmitting?: boolean;
    optimistic?: boolean;
    variant?: "default" | "destructive";
}

export const SettingsCardFooter = ({
    action,
    actionLabel,
    className,
    classNames,
    disabled,
    instructions,
    isPending,
    isSubmitting,
    variant,
}: SettingsCardFooterProperties) => (
    <CardFooter
        className={cn(
            "flex flex-col justify-between gap-4 rounded-b-xl md:flex-row",
            (actionLabel || instructions) && "border-t !py-4",
            variant === "destructive" ? "border-destructive/30 bg-destructive/15" : "bg-sidebar",
            className,
            classNames?.footer,
        )}
    >
        {isPending
            ? (
                <>
                    {instructions && <Skeleton className={cn("my-0.5 h-3 w-48 max-w-full md:h-4 md:w-56", classNames?.skeleton)} />}

                    {actionLabel && <Skeleton className={cn("h-8 w-14 md:ms-auto", classNames?.skeleton)} />}
                </>
            )
            : (
                <>
                    {instructions && (
                        <CardDescription className={cn("text-muted-foreground text-center text-xs md:text-start md:text-sm", classNames?.instructions)}>
                            {instructions}
                        </CardDescription>
                    )}

                    {actionLabel && (
                        <SettingsActionButton
                            actionLabel={actionLabel}
                            classNames={classNames}
                            disabled={disabled}
                            isSubmitting={isSubmitting}
                            onClick={action}
                            variant={variant}
                        />
                    )}
                </>
            )}
    </CardFooter>
);
