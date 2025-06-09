import { AuthProvider } from "@/components/auth-provider";
import { Outlet } from "@tanstack/react-router";

export const Route = createFileRoute({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <AuthProvider>
            <Outlet />
        </AuthProvider>
    );
}
