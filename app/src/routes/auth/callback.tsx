import { createFileRoute } from "@tanstack/react-router";

import { AuthCallback } from "@/features/auth/components/auth/auth-callback";

export const Route = createFileRoute("/auth/callback")({
    component: RouteComponent,
});

const RouteComponent = () => <AuthCallback />;
