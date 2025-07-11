"use client";

import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { SettingsCardClassNames } from "./settings-card";

interface SettingsActionButtonProperties extends ComponentProps<typeof Button> {
    actionLabel: ReactNode;
    classNames?: SettingsCardClassNames;
    disabled?: boolean;
    isSubmitting?: boolean;
}

export const SettingsActionButton = ({ actionLabel, classNames, disabled, isSubmitting = false, onClick, variant, ...properties }: SettingsActionButtonProperties) => (
    <Button
        className={cn(
            "md:ms-auto",
            classNames?.button,
            variant === "default" && classNames?.primaryButton,
            variant === "destructive" && classNames?.destructiveButton,
        )}
        disabled={isSubmitting || disabled}
        onClick={onClick}
        size="sm"
        type={onClick ? "button" : "submit"}
        variant={variant}
        {...properties}
    >
        {isSubmitting && <Loader2 className="animate-spin" />}
        {actionLabel}
    </Button>
);
