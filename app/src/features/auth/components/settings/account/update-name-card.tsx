"use client";

import { useContext } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import type { SettingsCardProps } from "../shared/settings-card";
import { UpdateFieldCard } from "./update-field-card";

export function UpdateNameCard({ className, classNames, ...props }: SettingsCardProps) {
    const {
        hooks: { useSession },
        nameRequired,
    } = useContext(AuthUIContext);

    const { data: sessionData } = useSession();

    return (
        <UpdateFieldCard
            className={className}
            classNames={classNames}
            value={sessionData?.user.name}
            description={t`Your display name for your account`}
            name="name"
            instructions={t`Enter your full name or display name`}
            label={t`Name`}
            placeholder={t`Enter your name`}
            required={nameRequired}
            {...props}
        />
    );
}
