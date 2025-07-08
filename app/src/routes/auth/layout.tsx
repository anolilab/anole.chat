import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex w-full min-h-screen bg-sidebar">
            <div className="hidden lg:flex lg:w-1/2 relative">a</div>
            <div className="w-full lg:w-1/2 relative flex items-center justify-center"><Outlet /></div>
        </div>
    );
}
