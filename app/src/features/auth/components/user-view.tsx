"use client";

import { t } from "@lingui/core/macro";

import { cn } from "@/lib/utils";
import type { Profile } from "../types/data-structure-types";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface UserViewProps {
    className?: string;
    isPending?: boolean;
    size?: "sm" | "default" | "lg" | null;
    user?: Profile | null;
}

/**
 * Displays user information with avatar and details in a compact view
 *
 * Renders a user's profile information with appropriate fallbacks:
 * - Shows avatar alongside user name and email when available
 * - Shows loading skeletons when isPending is true
 * - Falls back to generic "User" text when neither name nor email is available
 */
export function UserView({ className, isPending, size, user }: UserViewProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Avatar className="h-8 w-8 rounded-lg">
                {user?.image && <AvatarImage src={user.image} alt={user?.name || "User"} />}
                <AvatarFallback className="rounded-lg">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
            </Avatar>
            <div className={cn("grid flex-1 text-left leading-tight")}> 
                {isPending ? (
                    <>
                        <Skeleton className={cn("max-w-full", size === "lg" ? "h-4.5 w-32" : "h-3.5 w-24")} />
                        {size !== "sm" && (
                            <Skeleton
                                className={cn("mt-1.5 max-w-full", size === "lg" ? "h-3.5 w-40" : "h-3 w-32")}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <span className={cn("truncate font-semibold", size === "lg" ? "text-base" : "text-sm")}> 
                            {user?.displayUsername ||
                                user?.username ||
                                user?.displayName ||
                                user?.firstName ||
                                user?.name ||
                                user?.fullName ||
                                user?.email ||
                                t`User`}
                        </span>
                        {!user?.isAnonymous && size !== "sm" && (user?.name || user?.username) && (
                            <span className={cn("truncate opacity-70", size === "lg" ? "text-sm" : "text-xs")}>{user?.email}</span>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
