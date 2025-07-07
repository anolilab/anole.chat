import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/features/auth/components/auth/auth-card";

export const Route = createFileRoute("/auth/sign-up")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center p-2 md:p-6">
            <AuthCard pathname="sign-up" />
        </div>
    );
}
