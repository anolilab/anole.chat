import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
    beforeLoad: ({ context }) => {
        if (!context?.user?.id) {
            throw redirect({ to: "/auth/sign-in" });
        }

        throw redirect({ to: "/dashboard/settings/account" });
    },
    component: RouteComponent,
});

const RouteComponent = () => <div className="flex w-full flex-col items-center justify-center" />;
