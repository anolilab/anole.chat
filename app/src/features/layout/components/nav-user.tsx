"use client";

import { t } from "@lingui/core/macro";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { BadgeCheck, ChevronsUpDown, Coins, CreditCard, LogOut, PlusCircleIcon, SettingsIcon, Sparkles } from "lucide-react";
import { Fragment, useCallback, useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { UserView } from "@/features/auth/components/user-view";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { getLocalizedError } from "@/features/auth/lib/utils";
import type { AnyAuthClient } from "@/features/auth/types/auth-core-types";

export interface NavUserProperties {
    className?: string;
    disableDefaultLinks?: boolean;
    size?: "default" | "sm" | "lg" | "icon";
    trigger?: React.ReactNode;
}

export const NavUser = () => {
    const { isMobile } = useSidebar();
    const router = useRouter();
    const navigate = useNavigate();

    const {
        authClient,
        basePath = "/auth",
        hooks: { useListDeviceSessions, useSession },
        multiSession = false,
        mutators: { setActiveSession },
        onSessionChange,
        settings,
        toast,
        viewPaths = {
            SETTINGS: "settings",
            SIGN_IN: "sign-in",
            SIGN_OUT: "sign-out",
            SIGN_UP: "sign-up",
        },
    } = useAuth();

    let deviceSessions: AnyAuthClient["$Infer"]["Session"][] | undefined | null = null;
    let deviceSessionsPending = false;

    if (multiSession && useListDeviceSessions) {
        const { data, isPending } = useListDeviceSessions();

        deviceSessions = data;
        deviceSessionsPending = isPending;
    }

    const { data: sessionData, isPending: sessionPending } = useSession();
    const user = sessionData?.user;
    const [activeSessionPending, setActiveSessionPending] = useState(false);

    const isPending = sessionPending || activeSessionPending;

    const switchAccount = useCallback(
        async (sessionToken: string) => {
            setActiveSessionPending(true);

            try {
                await setActiveSession({ sessionToken });
                onSessionChange?.();
            } catch (error) {
                toast({
                    message: getLocalizedError({ error }),
                    variant: "error",
                });
                setActiveSessionPending(false);
            }
        },
        [setActiveSession, onSessionChange, toast],
    );

    useEffect(() => {
        if (!multiSession) {
            return;
        }

        setActiveSessionPending(false);
    }, [sessionData, multiSession]);

    // Always render the authenticated user menu
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild className="fill-white text-white">
                        <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground" size="lg">
                            <Avatar className="h-8 w-8 rounded-lg">
                                {user?.image && <AvatarImage alt={user?.name || "User"} src={user.image} />}
                                <AvatarFallback className="rounded-lg">{user?.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{user?.name || t`User`}</span>
                                <span className="truncate text-xs">Pro</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        onCloseAutoFocus={(e) => {
                            e.preventDefault();
                        }}
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <UserView isPending={isPending} user={user} />
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <Sparkles />
                                Upgrade to Pro
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Coins className="mr-2 h-4 w-4" />
                                {user?.skipCreditChecks ? (
                                    <span className="flex items-center gap-1">
                                        <Crown className="h-3 w-3" />
                                        Unlimited
                                    </span>
                                ) : (
                                    `${user?.credits ?? 0} Credits`
                                )}
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            {settings && (
                                <Link to={settings.url || `${settings.basePath || basePath}/${viewPaths.SETTINGS}`}>
                                    <DropdownMenuItem>
                                        <SettingsIcon />
                                        {t`Settings`}
                                    </DropdownMenuItem>
                                </Link>
                            )}
                            <DropdownMenuItem onClick={() => router.navigate({ to: "/dashboard/settings/account" })}>
                                <BadgeCheck />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <CreditCard />
                                Billing
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        {user && multiSession && (
                            <>
                                {!deviceSessions && deviceSessionsPending && (
                                    <>
                                        <DropdownMenuItem disabled>
                                            <UserView isPending={isPending} />
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                {deviceSessions
                                    ?.filter((sessionData) => sessionData.user.id !== user?.id)
                                    .map(({ session, user: sessionUser }) => (
                                        <Fragment key={session.id}>
                                            <DropdownMenuItem onClick={() => switchAccount(session.token)}>
                                                <UserView user={sessionUser} />
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </Fragment>
                                    ))}
                                <Link to={`${basePath}/${viewPaths.SIGN_IN}`}>
                                    <DropdownMenuItem>
                                        <PlusCircleIcon />
                                        {t`Add Account`}
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        <DropdownMenuItem
                            onClick={async () => {
                                await authClient.signOut();
                                await navigate({ to: "/auth/sign-in" });
                            }}
                        >
                            <LogOut />
                            {t`Log out`}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
};
