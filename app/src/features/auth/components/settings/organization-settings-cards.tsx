"use client";

import { useContext, useEffect } from "react";

import { AuthUIContext } from "../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { OrganizationLogoCard } from "../organization/organization-logo-card";
import { OrganizationNameCard } from "../organization/organization-name-card";
import { OrganizationSlugCard } from "../organization/organization-slug-card";
import type { AuthCardProps } from "../../types/ui-configuration-types";
import { DeleteOrganizationCard } from "../organization/delete-organization-card";

export function OrganizationSettingsCards({ className, classNames }: AuthCardProps) {
    const {
        basePath,
        hooks: { useActiveOrganization },
        organization,
        settings,
        replace,
        viewPaths,
    } = useContext(AuthUIContext);

    const { data: activeOrganization, isPending: organizationPending, isRefetching: organizationFetching } = useActiveOrganization();

    useEffect(() => {
        if (organizationPending || organizationFetching) return;
        if (!activeOrganization) replace(`${settings?.basePath || basePath}/${viewPaths.SETTINGS}`);
    }, [activeOrganization, organizationPending, organizationFetching, basePath, settings?.basePath, replace, viewPaths.SETTINGS]);

    return (
        <div className={cn("flex w-full flex-col gap-4 md:gap-6", className, classNames?.card)}>
            {organization?.logo && <OrganizationLogoCard classNames={classNames} />}

            <OrganizationNameCard classNames={classNames} />

            <OrganizationSlugCard classNames={classNames} />

            <DeleteOrganizationCard classNames={classNames} />
        </div>
    );
}
