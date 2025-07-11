"use client";

import { t } from "@lingui/core/macro";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { UserViewProps as UserViewProperties } from "../user-view";

/**
 * Displays user information with avatar and details in a compact view for personal accounts
 *
 * Renders a user's profile information with appropriate fallbacks:
 * - Shows avatar alongside user name and "Personal Account" subtitle when available
 * - Shows loading skeletons when isPending is true
 * - Falls back to generic "User" text when neither name nor email is available
 * - Always shows "Personal Account" as subtitle for default and lg sizes
 * - Supports customization through classNames prop
 */
// TODO: check this classNames
export const PersonalAccountView = ({ className, classNames, isPending, size, user }: UserViewProperties) => (
    <div className={cn("flex items-center gap-2", className, classNames?.base)}>
        <Avatar className="h-8 w-8 rounded-lg">
            {user?.image && <AvatarImage alt={user?.name || "User"} src={user.image} />}
            <AvatarFallback className="rounded-lg">{user?.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
        </Avatar>

        <div className={cn("grid flex-1 text-left leading-tight", classNames?.content)}>
            {isPending
                ? (
                    <>
                        <Skeleton className={cn("max-w-full", size === "lg" ? "h-4.5 w-32" : "h-3.5 w-24", classNames?.title, classNames?.skeleton)} />

                        {size !== "sm" && (
                            <Skeleton
                                className={cn("mt-1.5 max-w-full", size === "lg" ? "h-3.5 w-40" : "h-3 w-32", classNames?.subtitle, classNames?.skeleton)}
                            />
                        )}
                    </>
                )
                : (
                    <>
                        <span className={cn("truncate font-semibold", size === "lg" ? "text-base" : "text-sm", classNames?.title)}>
                            {user?.displayUsername
                                || user?.username
                                || user?.displayName
                                || user?.firstName
                                || user?.name
                                || user?.fullName
                                || user?.email
                                || t`User`}
                        </span>

                        {size !== "sm" && (
                            <span className={cn("truncate opacity-70", size === "lg" ? "text-sm" : "text-xs", classNames?.subtitle)}>
                                {t`Personal Account`}
                            </span>
                        )}
                    </>
                )}
        </div>
    </div>
);
