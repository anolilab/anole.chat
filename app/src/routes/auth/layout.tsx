import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="bg-sidebar flex min-h-screen w-full">
            <div className="relative hidden lg:flex lg:w-1/2">a</div>
            <div className="relative flex w-full items-center justify-center lg:w-1/2">
                <Outlet />
            </div>
        </div>
    );
}
