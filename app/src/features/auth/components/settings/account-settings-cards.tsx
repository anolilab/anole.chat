"use client";

import { t } from "@lingui/core/macro";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import type { AuthCardProperties } from "../../types/ui-configuration-types";
import { AccountsCard } from "./account/accounts-card";
import { AdminUserManagementCard } from "./account/admin-user-management-card";
import { CreditManagementCard } from "./account/credit-management-card";
import { CreditsCard } from "./account/credits-card";
import { DeleteAccountCard } from "./account/delete-account-card";
import { TransactionHistoryCard } from "./account/transaction-history-card";
import { UpdateAvatarCard } from "./account/update-avatar-card";
import { UpdateFieldCard } from "./account/update-field-card";
import { UpdateNameCard } from "./account/update-name-card";
import { UpdateUsernameCard } from "./account/update-username-card";
import { UsageAnalyticsCard } from "./account/usage-analytics-card";
import { ChangeEmailCard } from "./security/change-email-card";

export const AccountSettingsCards = ({ className, classNames }: AuthCardProperties) => {
    const {
        additionalFields,
        avatar,
        changeEmail,
        credentials,
        hooks: { useSession },
        multiSession,
        settings,
    } = useAuth();

    const { data: sessionData } = useSession();

    return (
        <div className={cn("flex w-full flex-col gap-4 md:gap-6", className, classNames?.card)}>
            {settings?.fields?.includes("image") && avatar && <UpdateAvatarCard classNames={classNames} />}

            {credentials?.username && <UpdateUsernameCard classNames={classNames} />}

            {settings?.fields?.includes("name") && <UpdateNameCard classNames={classNames} />}

            {changeEmail && <ChangeEmailCard classNames={classNames} />}

            <CreditsCard classNames={classNames} />

            <CreditManagementCard classNames={classNames} />

            <UsageAnalyticsCard classNames={classNames} />

            <TransactionHistoryCard classNames={classNames} />

            {/* Admin-only components */}
            {sessionData?.user?.role === "admin" && (
                <AdminUserManagementCard classNames={classNames} />
            )}

            {settings?.fields?.map((field) => {
                if (field === "image")
                    return null;

                if (field === "name")
                    return null;

                const additionalField = additionalFields?.[field];

                if (!additionalField)
                    return null;

                const { description, instructions, label, placeholder, required, type, validate } = additionalField;

                // @ts-ignore Custom fields are not typed
                const defaultValue = sessionData?.user[field] as unknown;

                return (
                    <UpdateFieldCard
                        classNames={classNames}
                        description={description}
                        instructions={instructions}
                        key={field}
                        label={label}
                        name={field}
                        placeholder={placeholder}
                        required={required}
                        type={type}
                        validate={validate}
                        value={defaultValue}
                    />
                );
            })}

            {multiSession && <AccountsCard classNames={classNames} />}

            <h2 className="text-lg font-semibold">{t`Danger Zone`}</h2>
            <DeleteAccountCard classNames={classNames} />
        </div>
    );
};
