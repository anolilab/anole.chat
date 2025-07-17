"use client";

import { t } from "@lingui/core/macro";
import { UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { useIsAnonymous } from "../hooks/use-is-anonymous";

export interface AnonymousUserIndicatorProperties {
    className?: string;
    classNames?: {
        base?: string;
        badge?: string;
        icon?: string;
        text?: string;
    };
    showIcon?: boolean;
    size?: "sm" | "default";
    variant?: "default" | "secondary" | "destructive" | "outline";
}

export const AnonymousUserIndicator = ({
    className,
    classNames,
    showIcon = true,
    size = "default",
    variant = "secondary",
}: AnonymousUserIndicatorProperties) => {
    const { isAnonymous } = useIsAnonymous();

    if (!isAnonymous) {
        return null;
    }

    return (
        <Badge
            className={cn(
                size === "sm" ? "text-xs px-1 py-0.5" : "text-xs",
                className,
                classNames?.base
            )}
            variant={variant}
        >
            {showIcon && (
                <UserX className={cn(
                    size === "sm" ? "mr-0.5 h-2.5 w-2.5" : "mr-1 h-3 w-3",
                    classNames?.icon
                )} />
            )}
            <span className={classNames?.text}>
                {t`Guest`}
            </span>
        </Badge>
    );
};