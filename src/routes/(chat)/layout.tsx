import { AuthProvider } from "@/components/auth/auth-provider";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(chat)")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <AuthProvider>
            <Outlet />
        </AuthProvider>
    );
}
