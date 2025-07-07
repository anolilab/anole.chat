import { createFileRoute, redirect } from "@tanstack/react-router";
import { SettingsCards } from "@/features/auth/components/settings/settings-cards";

export const Route = createFileRoute("/dashboard/settings/")({
    beforeLoad: ({ context }) => {
        if (!context.userId) {
            throw redirect({ to: "/auth/sign-in" });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex justify-center px-4 py-12">
            <SettingsCards className="max-w-xl" />
        </div>
    );
}
