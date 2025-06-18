import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {} from "@tanstack/react-router";
import AdminDashboard from "./-components/admin";
import { OrganizationCard } from "./-components/organization-card";
import UserCard from "./-components/user-card";
import { ApiKeysCard } from "./-components/api-keys-card";
import { authClient } from "@/features/auth/lib/client";

export const Route = createFileRoute("/dashboard/settings/")({
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

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <OrganizationCard session={data?.session?.data} activeOrganization={data?.organization?.data} />
            <ApiKeysCard sessionToken={data.session.data.session.token} />
            {/* <AdminDashboard /> */}
            <UserCard activeSessions={data?.sessions?.data || []} />
        </div>
    );
}
