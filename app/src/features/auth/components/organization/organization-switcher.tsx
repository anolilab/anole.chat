"use client";

import { t } from "@lingui/core/macro";
import { Link } from "@tanstack/react-router";
import { ChevronsUpDown, LogInIcon, PlusCircleIcon, SettingsIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { use, useCallback, useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import { getLocalizedError } from "../../lib/utils";
import type { User } from "../../types/auth-core-types";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import type { OrganizationLogoClassNames } from "./organization-logo";
import { OrganizationLogo } from "./organization-logo";
import type { OrganizationViewClassNames } from "./organization-view";
import { OrganizationView } from "./organization-view";
import { PersonalAccountView } from "./personal-account-view";

export interface OrganizationSwitcherClassNames {
    base?: string;
    content?: {
        avatar?: string;
        base?: string;
        menuItem?: string;
        organization?: OrganizationViewClassNames;
        separator?: string;
        user?: string;
    };
    skeleton?: string;
    trigger?: {
        avatar?: OrganizationLogoClassNames;
        base?: string;
        organization?: OrganizationViewClassNames;
        skeleton?: string;
        user?: string;
    };
}

export interface OrganizationSwitcherProperties extends Omit<ComponentProps<typeof Button>, "trigger"> {
    align?: "center" | "start" | "end";
    classNames?: OrganizationSwitcherClassNames;

    /**
     * Hide the personal organization option from the switcher.
     * When true, users can only switch between organizations and cannot access their personal account.
     * If no organization is active, the first available organization will be automatically selected.
     * @default false
     */
    hidePersonal?: boolean;
    onSetActive?: (organizationId: string | null) => void;
    trigger?: ReactNode;
}

/**
 * Displays an interactive user button with dropdown menu functionality
 *
 * Renders a user interface element that can be displayed as either an icon or full button:
 * - Shows a user avatar or placeholder when in icon mode
 * - Displays user name and email with dropdown indicator in full mode
 * - Provides dropdown menu with authentication options (sign in/out, settings, etc.)
 * - Supports multi-session functionality for switching between accounts
 * - Can be customized with additional links and styling options
 */
export const OrganizationSwitcher = ({ align, className, classNames, hidePersonal, onSetActive, size, trigger, ...properties }: OrganizationSwitcherProperties) => {
    const authContext = useAuth();

    const [activeOrganizationPending, setActiveOrganizationPending] = useState(false);
    const [isCreateOrgDialogOpen, setIsCreateOrgDialogOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const { data: sessionData, isPending: sessionPending } = authContext.hooks.useSession();
    const user = sessionData?.user;

    const { data: organizations } = authContext.hooks.useListOrganizations();
    const {
        data: activeOrganization,
        isPending: organizationPending,
        isRefetching,
        refetch: refetchActiveOrganization,
    } = authContext.hooks.useActiveOrganization();

    const isPending = sessionPending || activeOrganizationPending || organizationPending;

    useEffect(() => {
        if (isRefetching)
            return;

        setActiveOrganizationPending(false);
    }, [activeOrganization, isRefetching]);

    const switchOrganization = useCallback(
        async (organizationId: string | null) => {
            // Prevent switching to personal account when hidePersonal is true
            if (hidePersonal && organizationId === null) {
                return;
            }

            setActiveOrganizationPending(true);

            try {
                onSetActive?.(organizationId);
                await authContext.authClient.organization.setActive({
                    fetchOptions: {
                        throw: true,
                    },
                    organizationId,
                });
                await refetchActiveOrganization?.();
            } catch (error) {
                authContext.toast({
                    message: getLocalizedError({ error }),
                    variant: "error",
                });

                setActiveOrganizationPending(false);
            }
        },
        [authContext.authClient, authContext.toast, onSetActive, refetchActiveOrganization, hidePersonal],
    );

    // Determine whether to show personal view based on hidePersonal prop
    const shouldShowPersonal = !hidePersonal && !activeOrganization && !activeOrganizationPending;

    // Auto-select first organization when hidePersonal is true
    useEffect(() => {
        if (
            hidePersonal
            && !activeOrganization
            && !activeOrganizationPending
            && organizations
            && organizations.length > 0
            && !sessionPending
            && !organizationPending
        ) {
            switchOrganization(organizations[0].id);
        }
    }, [hidePersonal, activeOrganization, activeOrganizationPending, organizations, sessionPending, organizationPending, switchOrganization]);

    return (
        <>
            <DropdownMenu onOpenChange={setDropdownOpen} open={dropdownOpen}>
                <DropdownMenuTrigger asChild>
                    {trigger
                        || (size === "icon"
                            ? (
                                <Button
                                    className={cn("size-fit rounded-full", className, classNames?.trigger?.base)}
                                    size="icon"
                                    type="button"
                                    variant="ghost"
                                    {...properties}
                                >
                                    {(!sessionData && !isPending)
                                        || activeOrganizationPending
                                        || activeOrganization
                                        || (user as User)?.isAnonymous
                                        || hidePersonal
                                        ? (
                                            <OrganizationLogo
                                                aria-label={t`Organization`}
                                                className={cn(className, classNames?.base)}
                                                classNames={classNames?.trigger?.avatar}
                                                isPending={isPending || activeOrganizationPending}
                                                key={activeOrganization?.logo}
                                                organization={activeOrganization}
                                            />
                                        )
                                        : (
                                            <Avatar className={cn(className, classNames?.base)}>
                                                {user?.image && <AvatarImage alt={user?.name || "User"} src={user.image} />}
                                                <AvatarFallback className="rounded-lg">{user?.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                                            </Avatar>
                                        )}
                                </Button>
                            )
                            : (
                                <Button className={cn("!p-2", className, classNames?.trigger?.base)} size={size} {...properties}>
                                    {(!sessionData && !isPending)
                                        || activeOrganizationPending
                                        || activeOrganization
                                        || (user as User)?.isAnonymous
                                        || hidePersonal
                                        ? (
                                            <OrganizationView
                                                classNames={classNames?.trigger?.organization}
                                                isPending={isPending || activeOrganizationPending}
                                                organization={activeOrganization}
                                                size={size}
                                            />
                                        )
                                        : (
                                            <PersonalAccountView classNames={classNames?.trigger?.user} isPending={isPending} size={size} user={user} />
                                        )}

                                    <ChevronsUpDown className="ml-auto" />
                                </Button>
                            ))}
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align={align}
                    className={cn("w-[--radix-dropdown-menu-trigger-width] min-w-56 max-w-64", classNames?.content?.base)}
                    onCloseAutoFocus={(e) => { e.preventDefault(); }}
                >
                    <div className={cn("flex items-center justify-between gap-2 p-2", classNames?.content?.menuItem)}>
                        {(user && !user.isAnonymous) || isPending
                            ? (
                                <>
                                    {activeOrganizationPending || activeOrganization || hidePersonal
                                        ? (
                                            <OrganizationView
                                                classNames={classNames?.content?.organization}
                                                isPending={isPending || activeOrganizationPending}
                                                organization={activeOrganization}
                                            />
                                        )
                                        : (
                                            <PersonalAccountView classNames={classNames?.content?.user} isPending={isPending} user={user} />
                                        )}

                                    {!isPending && (
                                        <Link
                                            to={`${authContext.settings?.basePath || authContext.basePath}/${activeOrganization ? authContext.viewPaths.ORGANIZATION : authContext.viewPaths.SETTINGS}`}
                                        >
                                            <Button className="ml-auto !size-8" onClick={() => { setDropdownOpen(false); }} size="icon" variant="outline">
                                                <SettingsIcon className="size-4" />
                                            </Button>
                                        </Link>
                                    )}
                                </>
                            )
                            : (
                                <div className="text-muted-foreground -my-1 text-xs">{t`Organization`}</div>
                            )}
                    </div>

                    <DropdownMenuSeparator className={classNames?.content?.separator} />

                    {activeOrganization && !hidePersonal && (
                        <DropdownMenuItem onClick={() => switchOrganization(null)}>
                            <PersonalAccountView classNames={classNames?.content?.user} isPending={isPending} user={user} />
                        </DropdownMenuItem>
                    )}

                    {organizations?.map(
                        (organization) =>
                            organization.id !== activeOrganization?.id && (
                                <DropdownMenuItem key={organization.id} onClick={() => switchOrganization(organization.id)}>
                                    <OrganizationView classNames={classNames?.content?.organization} isPending={isPending} organization={organization} />
                                </DropdownMenuItem>
                            ),
                    )}

                    {organizations && organizations.length > 0 && (!hidePersonal || organizations.length > 1) && (
                        <DropdownMenuSeparator className={classNames?.content?.separator} />
                    )}

                    {!isPending && sessionData && !(user as User).isAnonymous
                        ? (
                            <DropdownMenuItem className={cn(classNames?.content?.menuItem)} onClick={() => { setIsCreateOrgDialogOpen(true); }}>
                                <PlusCircleIcon />
                                {t`Create Organization`}
                            </DropdownMenuItem>
                        )
                        : (
                            <Link to={`${authContext.basePath}/${authContext.viewPaths.SIGN_IN}`}>
                                <DropdownMenuItem className={cn(classNames?.content?.menuItem)}>
                                    <LogInIcon />
                                    {t`Sign In`}
                                </DropdownMenuItem>
                            </Link>
                        )}
                </DropdownMenuContent>
            </DropdownMenu>

            <CreateOrganizationDialog onOpenChange={setIsCreateOrgDialogOpen} open={isCreateOrgDialogOpen} />
        </>
    );
};
