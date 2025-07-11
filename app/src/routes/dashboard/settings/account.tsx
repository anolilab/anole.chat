import { createFileRoute, redirect } from "@tanstack/react-router";

import { AccountSettingsCards } from "@/features/auth/components/settings/account-settings-cards";

export const Route = createFileRoute("/dashboard/settings/account")({
    beforeLoad: ({ context }) => {
        if (!context?.user?.id) {
            throw redirect({ to: "/auth/sign-in" });
        }
    },
    component: RouteComponent,
});

const RouteComponent = () => <AccountSettingsCards />;
