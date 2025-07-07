import { OrganizationSettingsCards } from "@/features/auth/components/organization/organization-settings-cards";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings/organization")({
    beforeLoad: ({ context }) => {
        if (!context?.user?.id) {
            throw redirect({ to: "/auth/sign-in" });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    return <OrganizationSettingsCards />;
}
