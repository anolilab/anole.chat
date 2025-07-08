"use client";
import { ChevronsUpDown, LogInIcon, LogOutIcon, PlusCircleIcon, SettingsIcon, UserRoundPlus } from "lucide-react";
import { type ComponentProps, Fragment, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../lib/auth-ui-provider";
import { getLocalizedError } from "../lib/utils";
import { cn } from "@/lib/utils";
import type { AnyAuthClient, User } from "../types/auth-core-types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserAvatar, type UserAvatarClassNames } from "./user-avatar";
import { UserView, type UserViewClassNames } from "./user-view";

export interface UserButtonClassNames {
    base?: string;
    skeleton?: string;
    trigger?: {
        base?: string;
        avatar?: UserAvatarClassNames;
        user?: UserViewClassNames;
        skeleton?: string;
    };
    content?: {
        base?: string;
        user?: UserViewClassNames;
        avatar?: UserAvatarClassNames;
        menuItem?: string;
        separator?: string;
    };
}

export interface UserButtonProps {
    className?: string;
    classNames?: UserButtonClassNames;
    align?: "center" | "start" | "end";
    additionalLinks?: {
        href: string;
        icon?: ReactNode;
        label: ReactNode;
        signedIn?: boolean;
    }[];
    trigger?: ReactNode;
    disableDefaultLinks?: boolean;
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
export function UserButton({
    className,
    classNames,
    align,
    trigger,
    additionalLinks,
    disableDefaultLinks,
    size,
    ...props
}: UserButtonProps & ComponentProps<typeof Button>) {
    const {
        basePath,
        hooks: { useSession, useListDeviceSessions },
        mutators: { setActiveSession },
        multiSession,
        settings,
        signUp,
        toast,
        viewPaths,
        onSessionChange,
        Link,
    } = useContext(AuthUIContext);

    let deviceSessions: AnyAuthClient["$Infer"]["Session"][] | undefined | null = null;
    let deviceSessionsPending = false;

    if (multiSession) {
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

    // biome-ignore lint/correctness/useExhaustiveDependencies:
    useEffect(() => {
        if (!multiSession) return;

        setActiveSessionPending(false);
    }, [sessionData, multiSession]);

    const warningLogged = useRef(false);

    useEffect(() => {
        if (size || warningLogged.current) return;

        console.warn(
            "[Better Auth UI] The `size` prop of `UserButton` no longer defaults to `icon`. Please pass `size='icon'` to the `UserButton` component to get the same behaviour as before. This warning will be removed in a future release. It can be suppressed in the meantime by defining the `size` prop.",
        );

        warningLogged.current = true;
    }, [size]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild className={cn(size === "icon" && "rounded-full", classNames?.trigger?.base)}>
                {trigger ||
                    (size === "icon" ? (
                        <Button size="icon" className="size-fit rounded-full" variant="ghost">
                            <UserAvatar
                                key={user?.image}
                                isPending={isPending}
                                className={cn(className, classNames?.base)}
                                classNames={classNames?.trigger?.avatar}
                                user={user}
                                aria-label={t`Account`}
                            />
                        </Button>
                    ) : (
                        <Button className={cn("h-fit !p-2", className, classNames?.trigger?.base)} size={size} {...props}>
                            <UserView
                                size={size}
                                user={!(user as User)?.isAnonymous ? user : null}
                                isPending={isPending}
                                classNames={classNames?.trigger?.user}
                            />

                            <ChevronsUpDown className="ml-auto" />
                        </Button>
                    ))}
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className={cn("w-[--radix-dropdown-menu-trigger-width] min-w-56 max-w-64", classNames?.content?.base)}
                align={align}
                onCloseAutoFocus={(e) => e.preventDefault()}
            >
                <div className={cn("p-2", classNames?.content?.menuItem)}>
                    {(user && !(user as User).isAnonymous) || isPending ? (
                        <UserView user={user} isPending={isPending} classNames={classNames?.content?.user} />
                    ) : (
                        <div className="text-muted-foreground -my-1 text-xs">{t`Account`}</div>
                    )}
                </div>

                <DropdownMenuSeparator className={classNames?.content?.separator} />

                {additionalLinks?.map(
                    ({ href, icon, label, signedIn }, index) =>
                        (signedIn === undefined || (signedIn && !!sessionData) || (!signedIn && !sessionData)) && (
                            <Link key={index} href={href}>
                                <DropdownMenuItem className={classNames?.content?.menuItem}>
                                    <>
                                        {icon}
                                        {label}
                                    </>
                                </DropdownMenuItem>
                            </Link>
                        ),
                )}

                {!user || (user as User).isAnonymous ? (
                    <>
                        <Link href={`${basePath}/${viewPaths.SIGN_IN}`}>
                            <DropdownMenuItem className={classNames?.content?.menuItem}>
                                <LogInIcon />

                                {t`Sign In`}
                            </DropdownMenuItem>
                        </Link>

                        {signUp && (
                            <Link href={`${basePath}/${viewPaths.SIGN_UP}`}>
                                <DropdownMenuItem className={classNames?.content?.menuItem}>
                                    <UserRoundPlus />

                                    {t`Sign Up`}
                                </DropdownMenuItem>
                            </Link>
                        )}
                    </>
                ) : (
                    <>
                        {!disableDefaultLinks && settings && (
                            <Link href={settings.url || `${settings.basePath || basePath}/${viewPaths.SETTINGS}`}>
                                <DropdownMenuItem className={classNames?.content?.menuItem}>
                                    <SettingsIcon />

                                    {t`Settings`}
                                </DropdownMenuItem>
                            </Link>
                        )}

                        <Link href={`${basePath}/${viewPaths.SIGN_OUT}`}>
                            <DropdownMenuItem className={classNames?.content?.menuItem}>
                                <LogOutIcon />

                                {t`Sign Out`}
                            </DropdownMenuItem>
                        </Link>
                    </>
                )}

                {user && multiSession && (
                    <>
                        <DropdownMenuSeparator className={classNames?.content?.separator} />

                        {!deviceSessions && deviceSessionsPending && (
                            <>
                                <DropdownMenuItem disabled className={classNames?.content?.menuItem}>
                                    <UserView isPending={true} classNames={classNames?.content?.user} />
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className={classNames?.content?.separator} />
                            </>
                        )}

                        {deviceSessions
                            ?.filter((sessionData) => sessionData.user.id !== user?.id)
                            .map(({ session, user }) => (
                                <Fragment key={session.id}>
                                    <DropdownMenuItem className={classNames?.content?.menuItem} onClick={() => switchAccount(session.token)}>
                                        <UserView user={user} classNames={classNames?.content?.user} />
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className={classNames?.content?.separator} />
                                </Fragment>
                            ))}

                        <Link href={`${basePath}/${viewPaths.SIGN_IN}`}>
                            <DropdownMenuItem className={classNames?.content?.menuItem}>
                                <PlusCircleIcon />

                                {t`Add Account`}
                            </DropdownMenuItem>
                        </Link>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
