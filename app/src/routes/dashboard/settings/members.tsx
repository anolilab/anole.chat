import { createFileRoute, redirect } from "@tanstack/react-router";

import { OrganizationMembersCard } from "@/features/auth/components/organization/organization-members-card";
import { OrganizationInvitationsCard } from "@/features/auth/components/organization/organization-invitations-card";

export const Route = createFileRoute("/dashboard/settings/members")({
    beforeLoad: ({ context }) => {
        if (!context?.user?.id) {
            throw redirect({ to: "/auth/sign-in" });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <OrganizationMembersCard />

            <OrganizationInvitationsCard />
        </>
    );
}
