"use client";

import type { Session, User } from "better-auth";
import { EllipsisIcon, Loader2, LogOutIcon, RepeatIcon } from "lucide-react";
import { useContext, useState } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import { getLocalizedError } from "../../../lib/utils";
import { cn } from "@/lib/utils";
import type { Refetch } from "../../../types/hook-integration-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserView } from "../../user-view";
import type { SettingsCardClassNames } from "../shared/settings-card";

export interface AccountCellProps {
    className?: string;
    classNames?: SettingsCardClassNames;
    deviceSession: { user: User; session: Session };

    refetch?: Refetch;
}

export function AccountCell({ className, classNames, deviceSession, refetch }: AccountCellProps) {
    const {
        basePath,
        hooks: { useSession },
        mutators: { revokeDeviceSession, setActiveSession },
        toast,
        viewPaths,
        navigate,
    } = useContext(AuthUIContext);

    const { data: sessionData } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    const handleRevoke = async () => {
        setIsLoading(true);

        try {
            await revokeDeviceSession({
                sessionToken: deviceSession.session.token,
            });
            refetch?.();
        } catch (error) {
            setIsLoading(false);

            toast({
                variant: "error",
                message: getLocalizedError({ error }),
            });
        }
    };

    const handleSetActiveSession = async () => {
        setIsLoading(true);

        try {
            await setActiveSession({
                sessionToken: deviceSession.session.token,
            });
            refetch?.();
        } catch (error) {
            setIsLoading(false);

            toast({
                variant: "error",
                message: getLocalizedError({ error }),
            });
        }
    };

    const isCurrentSession = deviceSession.session.id === sessionData?.session.id;

    return (
        <Card className={cn("flex-row p-4", className, classNames?.cell)}>
            <UserView user={deviceSession.user} />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        className={cn("relative ms-auto", classNames?.button, classNames?.outlineButton)}
                        disabled={isLoading}
                        size="icon"
                        type="button"
                        variant="outline"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <EllipsisIcon className={classNames?.icon} />}
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                    {!isCurrentSession && (
                        <DropdownMenuItem onClick={handleSetActiveSession}>
                            <RepeatIcon className={classNames?.icon} />

                            {t`Switch Account`}
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                        onClick={() => {
                            if (isCurrentSession) {
                                navigate(`${basePath}/${viewPaths.SIGN_OUT}`);
                                return;
                            }

                            handleRevoke();
                        }}
                    >
                        <LogOutIcon className={classNames?.icon} />

                        {isCurrentSession ? t`Sign Out` : t`Revoke`}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </Card>
    );
}
