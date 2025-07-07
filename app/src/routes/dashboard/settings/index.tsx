import { createFileRoute, redirect } from "@tanstack/react-router";
import { SettingsCards } from "@/features/auth/components/settings/settings-cards";

export const Route = createFileRoute("/dashboard/settings/")({
    beforeLoad: ({ context }) => {
        if (!context.userId) {
            throw redirect({ to: "/login" });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex justify-center py-12 px-4">
            <SettingsCards className="max-w-xl" />
        </div>
    );
}
