"use client";

import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SettingsCardClassNames } from "./settings-card";

interface SettingsActionButtonProps extends ComponentProps<typeof Button> {
    classNames?: SettingsCardClassNames;
    actionLabel: ReactNode;
    disabled?: boolean;
    isSubmitting?: boolean;
}

export function SettingsActionButton({ classNames, actionLabel, disabled, isSubmitting = false, variant, onClick, ...props }: SettingsActionButtonProps) {
    return (
        <Button
            className={cn(
                "md:ms-auto",
                classNames?.button,
                variant === "default" && classNames?.primaryButton,
                variant === "destructive" && classNames?.destructiveButton,
            )}
            disabled={isSubmitting || disabled}
            size="sm"
            type={onClick ? "button" : "submit"}
            variant={variant}
            onClick={onClick}
            {...props}
        >
            {isSubmitting && <Loader2 className="animate-spin" />}
            {actionLabel}
        </Button>
    );
}
