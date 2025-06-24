import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
    beforeLoad: ({ context }) => {
        if (!context.userId) {
            throw redirect({ to: "/login" });
        }

        throw redirect({ to: "/dashboard/settings" });
    },
    component: RouteComponent,
});

function RouteComponent() {
    return <div className="flex w-full flex-col items-center justify-center"></div>;
}
