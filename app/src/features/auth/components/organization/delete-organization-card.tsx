"use client"

import { useContext, useState } from "react"

import { AuthUIContext } from "../../lib/auth-ui-provider"
import { SettingsCard } from "../settings/shared/settings-card"
import type { SettingsCardProps } from "../settings/shared/settings-card"
import { DeleteOrganizationDialog } from "./delete-organization-dialog"

export function DeleteOrganizationCard({
    className,
    classNames,
    localization
}: SettingsCardProps) {
    const {
        hooks: { useActiveOrganization, useSession },
        localization: contextLocalization
    } = useContext(AuthUIContext)

    localization = { ...contextLocalization, ...localization }

    const [showDialog, setShowDialog] = useState(false)

    const { data: activeOrganization, isPending: organizationPending } =
        useActiveOrganization()
    const { data: sessionData, isPending: sessionPending } = useSession()

    const isPending = organizationPending || sessionPending

    const membership = activeOrganization?.members?.find(
        (member) => member.userId === sessionData?.user.id
    )
    const isOwner = membership?.role === "owner"

    if (!isPending && !isOwner) return null

    return (
        <>
            <SettingsCard
                className={className}
                classNames={classNames}
                actionLabel={localization?.DELETE_ORGANIZATION}
                description={localization?.DELETE_ORGANIZATION_DESCRIPTION}
                isPending={isPending}
                title={localization?.DELETE_ORGANIZATION}
                variant="destructive"
                action={() => setShowDialog(true)}
            />

            <DeleteOrganizationDialog
                classNames={classNames}
                localization={localization}
                open={showDialog}
                onOpenChange={setShowDialog}
            />
        </>
    )
}
