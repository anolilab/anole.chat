import { SecuritySettingsCards } from "@/features/auth/components/settings/security-settings-cards";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings/security")({
    beforeLoad: ({ context }) => {
        if (!context?.user?.id) {
            throw redirect({ to: "/auth/sign-in" });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    return <SecuritySettingsCards />;
}
