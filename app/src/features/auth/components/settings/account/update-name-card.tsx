"use client";

import { t } from "@lingui/core/macro";
import { use } from "react";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import type { SettingsCardProps as SettingsCardProperties } from "../shared/settings-card";
import { UpdateFieldCard } from "./update-field-card";

export const UpdateNameCard = ({ className, classNames, ...properties }: SettingsCardProperties) => {
    const {
        hooks: { useSession },
        nameRequired,
    } = useAuth();

    const { data: sessionData } = useSession();

    return (
        <UpdateFieldCard
            className={className}
            classNames={classNames}
            description={t`Your display name for your account`}
            instructions={t`Enter your full name or display name`}
            label={t`Name`}
            name="name"
            placeholder={t`Enter your name`}
            required={nameRequired}
            value={sessionData?.user.name}
            {...properties}
        />
    );
};
