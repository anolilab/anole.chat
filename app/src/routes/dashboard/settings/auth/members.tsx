import { createFileRoute, redirect } from "@tanstack/react-router";

import { OrganizationInvitationsCard } from "@/features/auth/components/organization/organization-invitations-card";
import { OrganizationMembersCard } from "@/features/auth/components/organization/organization-members-card";

export const Route = createFileRoute("/dashboard/settings/auth/members")({
    beforeLoad: ({ context }) => {
        if (!context?.user?.id) {
            throw redirect({ to: "/auth/sign-in" });
        }
    },
    component: RouteComponent,
});

const RouteComponent = () => (
    <>
        <OrganizationMembersCard />

        <OrganizationInvitationsCard />
    </>
);
