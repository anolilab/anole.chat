import { APIKeysCard } from "@/features/auth/components/settings/api-key/api-keys-card";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings/api-keys")({
    beforeLoad: ({ context }) => {
        if (!context?.user?.id) {
            throw redirect({ to: "/auth/sign-in" });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    return <APIKeysCard />;
}
