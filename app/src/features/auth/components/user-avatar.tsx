"use client";

import { UserRoundIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useContext } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../lib/auth-ui-provider";
import { useGravatar } from "../hooks/use-gravatar";
import { cn } from "@/lib/utils";
import type { Profile } from "../types/data-structure-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export interface UserAvatarClassNames {
    base?: string;
    image?: string;
    fallback?: string;
    fallbackIcon?: string;
    skeleton?: string;
}

export interface UserAvatarProps {
    classNames?: UserAvatarClassNames;
    isPending?: boolean;
    size?: "sm" | "default" | "lg" | "xl" | null;
    user?: Profile | null;
}

/**
 * Displays a user avatar with image and fallback support
 *
 * Renders a user's avatar image when available, with appropriate fallbacks:
 * - Shows a skeleton when isPending is true
 * - Displays first two characters of user's name when no image is available
 * - Falls back to a generic user icon when neither image nor name is available
 */
export function UserAvatar({ className, classNames, isPending, size, user, ...props }: UserAvatarProps & ComponentProps<typeof Avatar>) {
    const { gravatar } = useContext(AuthUIContext);

    const name = user?.displayUsername || user?.username || user?.displayName || user?.firstName || user?.name || user?.fullName || user?.email;
    const userImage = user?.image || user?.avatar || user?.avatarUrl;

    // Use the gravatar hook to handle async URL generation
    const gravatarUrl = useGravatar(gravatar && user?.email ? user.email : null, gravatar === true ? undefined : gravatar || undefined);

    const src = gravatar ? gravatarUrl : userImage;

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
            {...props}
        >
            <AvatarImage alt={name || t`User`} className={classNames?.image} src={src || undefined} />

            <AvatarFallback className={cn("text-foreground uppercase", classNames?.fallback)} delayMs={src ? 600 : undefined}>
                {firstTwoCharacters(name) || <UserRoundIcon className={cn("size-[50%]", classNames?.fallbackIcon)} />}
            </AvatarFallback>
        </Avatar>
    );
}

const firstTwoCharacters = (name?: string | null) => name?.slice(0, 2);
