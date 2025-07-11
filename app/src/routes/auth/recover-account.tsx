import { createFileRoute } from "@tanstack/react-router";

import { AuthCard } from "@/features/auth/components/auth/auth-card";

export const Route = createFileRoute("/auth/recover-account")({
    component: RouteComponent,
});

const RouteComponent = () => <AuthCard view="RECOVER_ACCOUNT" />;
