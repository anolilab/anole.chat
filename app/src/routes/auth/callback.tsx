import { createFileRoute } from "@tanstack/react-router";
import { AuthCallback } from "@/features/auth/components/auth/auth-callback";

export const Route = createFileRoute("/auth/callback")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center p-2 md:p-6">
            <AuthCallback />
        </div>
    );
}
