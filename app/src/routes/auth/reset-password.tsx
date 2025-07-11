import { createFileRoute } from "@tanstack/react-router";

import { AuthCard } from "@/features/auth/components/auth/auth-card";

export const Route = createFileRoute("/auth/reset-password")({
    component: RouteComponent,
});

const RouteComponent = () => <AuthCard view="RESET_PASSWORD" />;
