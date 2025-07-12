"use client";

import { t } from "@lingui/core/macro";
import type { Organization } from "better-auth/plugins/organization";
import { BuildingIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface OrganizationLogoClassNames {
    base?: string;
    fallback?: string;
    fallbackIcon?: string;
    image?: string;
    skeleton?: string;
}

export interface OrganizationLogoProperties {
    classNames?: OrganizationLogoClassNames;
    isPending?: boolean;
    organization?: Partial<Organization> | null;
    size?: "sm" | "default" | "lg" | "xl" | null;
}

/**
 * Displays an organization logo with image and fallback support
 *
 * Renders an organization's logo image when available, with appropriate fallbacks:
 * - Shows a skeleton when isPending is true
 * - Falls back to a building icon when no logo is available
 */
export const OrganizationLogo = ({
    className,
    classNames,
    isPending,
    organization,
    size,
    ...properties
}: ComponentProps<typeof Avatar> & OrganizationLogoProperties) => {
    const name = organization?.name;
    const source = organization?.logo;

    if (isPending) {
        return (
            <Skeleton
                className={cn(
                    "shrink-0 rounded-full",
                    size === "sm" ? "size-6" : size === "lg" ? "size-10" : size === "xl" ? "size-12" : "size-8",
                    className,
                    classNames?.base,
                    classNames?.skeleton,
                )}
            />
        );
    }

    return (
        <Avatar
            className={cn("bg-muted", size === "sm" ? "size-6" : size === "lg" ? "size-10" : size === "xl" ? "size-12" : "size-8", className, classNames?.base)}
            {...properties}
        >
            <AvatarImage alt={name || t`Organization`} className={classNames?.image} src={source || undefined} />

            <AvatarFallback className={cn("text-foreground", classNames?.fallback)} delayMs={source ? 600 : undefined}>
                <BuildingIcon className={cn("size-[50%]", classNames?.fallbackIcon)} />
            </AvatarFallback>
        </Avatar>
    );
};
