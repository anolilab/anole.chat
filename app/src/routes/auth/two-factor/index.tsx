import { createFileRoute } from "@tanstack/react-router";

import { AuthCard } from "@/features/auth/components/auth/auth-card";

export const Route = createFileRoute("/auth/two-factor/")({
    component: RouteComponent,
});

const RouteComponent = () => <AuthCard view="TWO_FACTOR" />;
