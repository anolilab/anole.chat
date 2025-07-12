"use client";

import { t } from "@lingui/core/macro";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import type { User } from "../../../types/auth-core-types";
import type { SettingsCardProperties } from "../shared/settings-card";
import { UpdateFieldCard } from "./update-field-card";

export const UpdateUsernameCard = ({ className, classNames, ...properties }: SettingsCardProperties) => {
    const {
        hooks: { useSession },
    } = useAuth();

    const { data: sessionData } = useSession();
    const value = (sessionData?.user as User)?.displayUsername || (sessionData?.user as User)?.username;

    return (
        <UpdateFieldCard
            className={className}
            classNames={classNames}
            description={t`Your unique username for your account`}
            instructions={t`Choose a unique username`}
            label={t`Username`}
            name="username"
            placeholder={t`Enter your username`}
            required
            value={value}
            {...properties}
        />
    );
};
