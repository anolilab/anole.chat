"use client";
import { useContext } from "react";
import { AuthUIContext } from "../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { AccountsCard } from "./account/accounts-card";
import { UpdateAvatarCard } from "./account/update-avatar-card";
import { UpdateFieldCard } from "./account/update-field-card";
import { UpdateNameCard } from "./account/update-name-card";
import { UpdateUsernameCard } from "./account/update-username-card";
import { ChangeEmailCard } from "./security/change-email-card";
import type { AuthCardProps } from "../../types/ui-configuration-types";

export function AccountSettingsCards({ className, classNames }: AuthCardProps) {
    const {
        additionalFields,
        avatar,
        changeEmail,
        credentials,
        hooks: { useSession },
        multiSession,
        settings,
    } = useContext(AuthUIContext);

    const { data: sessionData } = useSession();

    return (
        <div className={cn("flex w-full flex-col gap-4 md:gap-6", className, classNames?.card)}>
            {settings?.fields?.includes("image") && avatar && <UpdateAvatarCard classNames={classNames} />}

            {credentials?.username && <UpdateUsernameCard classNames={classNames} />}

            {settings?.fields?.includes("name") && <UpdateNameCard classNames={classNames} />}

            {changeEmail && <ChangeEmailCard classNames={classNames} />}

            {settings?.fields?.map((field) => {
                if (field === "image") return null;
                if (field === "name") return null;
                const additionalField = additionalFields?.[field];
                if (!additionalField) return null;

                const { label, description, instructions, placeholder, required, type, validate } = additionalField;

                // @ts-ignore Custom fields are not typed
                const defaultValue = sessionData?.user[field] as unknown;

                return (
                    <UpdateFieldCard
                        key={field}
                        classNames={classNames}
                        value={defaultValue}
                        description={description}
                        name={field}
                        instructions={instructions}
                        label={label}
                        placeholder={placeholder}
                        required={required}
                        type={type}
                        validate={validate}
                    />
                );
            })}

            {multiSession && <AccountsCard classNames={classNames} />}
        </div>
    );
}
