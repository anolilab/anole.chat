"use client";

import { BadgeCheck, ChevronsUpDown, CreditCard, LogOut, Sparkles, SettingsIcon, PlusCircleIcon } from "lucide-react";
import { Fragment, useCallback, useContext, useEffect, useState } from "react";
import { t } from "@lingui/core/macro";

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
import { useRouter } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { AuthUIContext } from "@/features/auth/lib/auth-ui-provider";
import { getLocalizedError } from "@/features/auth/lib/utils";
import type { AnyAuthClient } from "@/features/auth/types/auth-core-types";
import { UserView } from "@/features/auth/components/user-view";

export interface NavUserProps {
    className?: string;
    trigger?: React.ReactNode;
    disableDefaultLinks?: boolean;
    size?: "default" | "sm" | "lg" | "icon";
}

export function NavUser() {
    const { isMobile } = useSidebar();
    const router = useRouter();
    const navigate = useNavigate();

    const authContext = useContext(AuthUIContext);
    const {
        basePath = "/auth",
        hooks: { useSession, useListDeviceSessions },
        mutators: { setActiveSession },
        multiSession = false,
        settings,
        toast,
        viewPaths = {
            SIGN_IN: "sign-in",
            SIGN_UP: "sign-up",
            SIGN_OUT: "sign-out",
            SETTINGS: "settings",
        },
        onSessionChange,
        Link,
        authClient,
    } = authContext;

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
                    variant: "error",
                    message: getLocalizedError({ error }),
                });
                setActiveSessionPending(false);
            }
        },
        [setActiveSession, onSessionChange, toast],
    );

    useEffect(() => {
        if (!multiSession) return;
        setActiveSessionPending(false);
    }, [sessionData, multiSession]);

    // Always render the authenticated user menu
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild className="fill-white text-white">
                        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                        <Avatar className="h-8 w-8 rounded-lg">
                            {user?.image && <AvatarImage src={user.image} alt={user?.name || "User"} />}
                            <AvatarFallback className="rounded-lg">
                                {user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{user?.name || t`User`}</span>
                                <span className="truncate text-xs">Pro</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                        onCloseAutoFocus={(e) => e.preventDefault()}
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
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            {settings && (
                                <Link href={settings.url || `${settings.basePath || basePath}/${viewPaths.SETTINGS}`}>
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
                                            <DropdownMenuItem 
                                                onClick={() => switchAccount(session.token)}
                                            >
                                                <UserView user={sessionUser} />
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </Fragment>
                                    ))}
                                <Link href={`${basePath}/${viewPaths.SIGN_IN}`}>
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
}
