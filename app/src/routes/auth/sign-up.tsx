import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/features/auth/components/auth/auth-card";

export const Route = createFileRoute("/auth/sign-up")({
    component: RouteComponent,
});

function RouteComponent() {
    return (<AuthCard view="SIGN_UP" />);
}
