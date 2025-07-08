import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/features/auth/components/auth/auth-card";

export const Route = createFileRoute("/auth/two-factor/")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <AuthCard pathname="two-factor" />
    );
}
