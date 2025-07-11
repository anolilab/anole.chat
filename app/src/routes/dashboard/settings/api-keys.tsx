import { createFileRoute, redirect } from "@tanstack/react-router";

import { APIKeysCard } from "@/features/auth/components/settings/api-key/api-keys-card";

export const Route = createFileRoute("/dashboard/settings/api-keys")({
    beforeLoad: ({ context }) => {
        if (!context?.user?.id) {
            throw redirect({ to: "/auth/sign-in" });
        }
    },
    component: RouteComponent,
});

const RouteComponent = () => <APIKeysCard />;
