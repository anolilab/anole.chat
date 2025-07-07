import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { } from "@tanstack/react-router";
import AdminDashboard from "./-components/admin";
import { OrganizationCard } from "./-components/organization-card";
import UserCard from "./-components/user-card";
import { authClient } from "@/lib/auth/client";

export const Route = createFileRoute("/dashboard/settings/")({
    beforeLoad: ({ context }) => {
        if (!context.userId) {
            throw redirect({ to: "/login" });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["sessions"],
        queryFn: async () => {
            const getSession = authClient.getSession();
            const getSessions = authClient.listSessions();
            const getOrganization = authClient.organization.getFullOrganization();
            const [session, organization, sessions] = await Promise.all([getSession, getOrganization, getSessions]);
            return { session, organization, sessions } as const;
        },
    });

    return (
        <div>
            {/* <OrganizationCard session={data?.session?.data} activeOrganization={data?.organization?.data} /> */}
            {/* <AdminDashboard /> */}
            <UserCard activeSessions={data?.sessions?.data || []} />
        </div>
    );
}
