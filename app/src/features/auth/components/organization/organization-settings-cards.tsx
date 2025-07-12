"use client";

import { use, useEffect } from "react";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import type { AuthCardProperties } from "../../types/ui-configuration-types";
import { DeleteOrganizationCard } from "../organization/delete-organization-card";
import { OrganizationLogoCard } from "../organization/organization-logo-card";
import { OrganizationNameCard } from "../organization/organization-name-card";
import { OrganizationSlugCard } from "../organization/organization-slug-card";

export const OrganizationSettingsCards = ({ className, classNames }: AuthCardProperties) => {
    const {
        basePath,
        hooks: { useActiveOrganization },
        organization,
        replace,
        settings,
        viewPaths,
    } = useAuth();

    const { data: activeOrganization, isPending: organizationPending, isRefetching: organizationFetching } = useActiveOrganization();

    useEffect(() => {
        if (organizationPending || organizationFetching)
            return;

        if (!activeOrganization)
            replace(`${settings?.basePath || basePath}/${viewPaths.SETTINGS}`);
    }, [activeOrganization, organizationPending, organizationFetching, basePath, settings?.basePath, replace, viewPaths.SETTINGS]);

    return (
        <div className={cn("flex w-full flex-col gap-4 md:gap-6", className, classNames?.card)}>
            {organization?.logo && <OrganizationLogoCard classNames={classNames} />}

            <OrganizationNameCard classNames={classNames} />

            <OrganizationSlugCard classNames={classNames} />

            <DeleteOrganizationCard classNames={classNames} />
        </div>
    );
};
