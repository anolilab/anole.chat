"use client";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import type { AuthCardProperties } from "../../types/ui-configuration-types";
import { DeleteAccountCard } from "./account/delete-account-card";
import { PasskeysCard } from "./passkey/passkeys-card";
import { ProvidersCard } from "./providers/providers-card";
import { ChangePasswordCard } from "./security/change-password-card";
import { SessionsCard } from "./security/sessions-card";
import { TwoFactorCard } from "./two-factor/two-factor-card";

export const SecuritySettingsCards = ({ className, classNames }: AuthCardProperties) => {
    const { credentials, deleteUser, genericOAuth, hooks, passkey, social, twoFactor } = useAuth();

    const { useListAccounts } = hooks;

    const { data: accounts, isPending: accountsPending, refetch: refetchAccounts } = useListAccounts();

    const credentialsLinked = accounts?.some((accumulator) => accumulator.provider === "credential");

    return (
        <div className={cn("flex w-full flex-col gap-4 md:gap-6", className, classNames?.card)}>
            {credentials && <ChangePasswordCard accounts={accounts} classNames={classNames} isPending={accountsPending} skipHook />}

            {(social?.providers?.length || genericOAuth?.providers?.length) && (
                <ProvidersCard accounts={accounts} classNames={classNames} isPending={accountsPending} refetch={refetchAccounts} skipHook />
            )}

            {twoFactor && credentialsLinked && <TwoFactorCard classNames={classNames} />}

            {passkey && <PasskeysCard classNames={classNames} />}

            <SessionsCard classNames={classNames} />

            {deleteUser && <DeleteAccountCard accounts={accounts} classNames={classNames} isPending={accountsPending} skipHook />}
        </div>
    );
};
