"use client"

import type { Session, User } from "better-auth"
import { EllipsisIcon, Loader2, LogOutIcon, RepeatIcon } from "lucide-react"
import { useContext, useState } from "react"

import { AuthUIContext } from "../../../lib/auth-ui-provider"
import { getLocalizedError } from "../../../lib/utils"
import { cn } from "@/lib/utils"
import type { AuthLocalization } from "../../../localization/auth-localization"
import type { Refetch } from "../../../types/hook-integration-types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { UserView } from "../../user-view"
import type { SettingsCardClassNames } from "../shared/settings-card"

export interface AccountCellProps {
    className?: string
    classNames?: SettingsCardClassNames
    deviceSession: { user: User; session: Session }
    localization?: Partial<AuthLocalization>
    refetch?: Refetch
}

export function AccountCell({
    className,
    classNames,
    deviceSession,
    localization,
    refetch
}: AccountCellProps) {
    const {
        basePath,
        localization: contextLocalization,
        hooks: { useSession },
        mutators: { revokeDeviceSession, setActiveSession },
        toast,
        viewPaths,
        navigate
    } = useContext(AuthUIContext)

    localization = { ...contextLocalization, ...localization }

    const { data: sessionData } = useSession()
    const [isLoading, setIsLoading] = useState(false)

    const handleRevoke = async () => {
        setIsLoading(true)

        try {
            await revokeDeviceSession({
                sessionToken: deviceSession.session.token
            })
            refetch?.()
        } catch (error) {
            setIsLoading(false)

            toast({
                variant: "error",
                message: getLocalizedError({ error, localization })
            })
        }
    }

    const handleSetActiveSession = async () => {
        setIsLoading(true)

        try {
            await setActiveSession({
                sessionToken: deviceSession.session.token
            })
            refetch?.()
        } catch (error) {
            setIsLoading(false)

            toast({
                variant: "error",
                message: getLocalizedError({ error, localization })
            })
        }
    }

    const isCurrentSession =
        deviceSession.session.id === sessionData?.session.id

    return (
        <Card className={cn("flex-row p-4", className, classNames?.cell)}>
            <UserView user={deviceSession.user} localization={localization} />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        className={cn(
                            "relative ms-auto",
                            classNames?.button,
                            classNames?.outlineButton
                        )}
                        disabled={isLoading}
                        size="icon"
                        type="button"
                        variant="outline"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <EllipsisIcon className={classNames?.icon} />
                        )}
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                    {!isCurrentSession && (
                        <DropdownMenuItem onClick={handleSetActiveSession}>
                            <RepeatIcon className={classNames?.icon} />

                            {localization.SWITCH_ACCOUNT}
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                        onClick={() => {
                            if (isCurrentSession) {
                                navigate(`${basePath}/${viewPaths.SIGN_OUT}`)
                                return
                            }

                            handleRevoke()
                        }}
                    >
                        <LogOutIcon className={classNames?.icon} />

                        {isCurrentSession
                            ? localization.SIGN_OUT
                            : localization.REVOKE}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </Card>
    )
}
