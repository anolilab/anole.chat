import { createFileRoute, redirect } from "@tanstack/react-router";

import { OrganizationsCard } from "@/features/auth/components/organization/organizations-card";

export const Route = createFileRoute("/dashboard/settings/organizations")({
    beforeLoad: ({ context }) => {
        if (!context?.user?.id) {
            throw redirect({ to: "/auth/sign-in" });
        }
    },
    component: RouteComponent,
});

const RouteComponent = () => <OrganizationsCard />;
