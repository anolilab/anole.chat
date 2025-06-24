import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <Outlet />
        </div>
    );
}
