import { createFileRoute, redirect } from "@tanstack/react-router";

import { SecuritySettingsCards } from "@/features/auth/components/settings/security-settings-cards";

export const Route = createFileRoute("/dashboard/settings/auth/security")({
    beforeLoad: ({ context }) => {
        if (!context?.user?.id) {
            throw redirect({ to: "/auth/sign-in" });
        }
    },
    component: RouteComponent,
});

const RouteComponent = () => <SecuritySettingsCards />;
