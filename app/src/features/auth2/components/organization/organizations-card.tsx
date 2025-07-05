"use client"
import { useContext, useState } from "react"

import { useIsHydrated } from "../../hooks/use-hydrated"
import { AuthUIContext } from "../../lib/auth-ui-provider"
import { cn } from "@/lib/utils"
import { SettingsCard } from "../settings/shared/settings-card"
import type { SettingsCardProps } from "../settings/shared/settings-card"
import { CardContent } from "@/components/ui/card"
import { CreateOrganizationDialog } from "./create-organization-dialog"
import { OrganizationCell } from "./organization-cell"

export function OrganizationsCard({
    className,
    classNames,
    localization,
    ...props
}: SettingsCardProps) {
    const {
        hooks: { useListOrganizations },
        localization: contextLocalization
    } = useContext(AuthUIContext)

    localization = { ...contextLocalization, ...localization }

    const isHydrated = useIsHydrated()
    const { data: organizations, isPending: organizationsPending } =
        useListOrganizations()

    const isPending = !isHydrated || organizationsPending

    const [createDialogOpen, setCreateDialogOpen] = useState(false)

    return (
        <>
            <SettingsCard
                className={className}
                classNames={classNames}
                title={localization.ORGANIZATIONS}
                description={localization.ORGANIZATIONS_DESCRIPTION}
                instructions={localization.ORGANIZATIONS_INSTRUCTIONS}
                actionLabel={localization.CREATE_ORGANIZATION}
                action={() => setCreateDialogOpen(true)}
                isPending={isPending}
                {...props}
            >
                {organizations && organizations?.length > 0 && (
                    <CardContent
                        className={cn("grid gap-4", classNames?.content)}
                    >
                        {organizations?.map((organization) => (
                            <OrganizationCell
                                key={organization.id}
                                classNames={classNames}
                                organization={organization}
                                localization={localization}
                            />
                        ))}
                    </CardContent>
                )}
            </SettingsCard>

            <CreateOrganizationDialog
                classNames={classNames}
                localization={localization}
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
            />
        </>
    )
}
