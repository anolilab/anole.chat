"use client";

import { Button } from "@anole/ui/components/button";
import { Card } from "@anole/ui/components/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@anole/ui/components/dropdown-menu";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import type { Session, User } from "better-auth";
import { EllipsisIcon, Loader2, LogOutIcon, RepeatIcon } from "lucide-react";
import { use, useState } from "react";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import { getLocalizedError } from "../../../lib/utils";
import type { Refetch } from "../../../types/hook-integration-types";
import { UserView } from "../../user-view";
import type { SettingsCardClassNames } from "../shared/settings-card";

export interface AccountCellProperties {
    className?: string;
    classNames?: SettingsCardClassNames;
    deviceSession: { session: Session; user: User };

    refetch?: Refetch;
}

export const AccountCell = ({ className, classNames, deviceSession, refetch }: AccountCellProperties) => {
    const {
        basePath,
        hooks: { useSession },
        mutators: { revokeDeviceSession, setActiveSession },
        navigate,
        toast,
        viewPaths,
    } = useAuth();
    const { t } = useLingui();

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
                message: getLocalizedError({ error, t }),
                variant: "error",
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
                message: getLocalizedError({ error, t }),
                variant: "error",
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
};
