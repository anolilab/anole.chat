"use client";

import { useContext } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../../lib/auth-ui-provider";
import type { User } from "../../../types/auth-core-types";
import type { SettingsCardProps } from "../shared/settings-card";
import { UpdateFieldCard } from "./update-field-card";

export function UpdateUsernameCard({ className, classNames, ...props }: SettingsCardProps) {
    const {
        hooks: { useSession },
    } = useContext(AuthUIContext);

    const { data: sessionData } = useSession();
    const value = (sessionData?.user as User)?.displayUsername || (sessionData?.user as User)?.username;

    return (
        <UpdateFieldCard
            className={className}
            classNames={classNames}
            value={value}
            description={t`Your unique username for your account`}
            name="username"
            instructions={t`Choose a unique username`}
            label={t`Username`}
            placeholder={t`Enter your username`}
            required
            {...props}
        />
    );
}
