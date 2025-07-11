import { createFileRoute } from "@tanstack/react-router";

import { AuthCard } from "@/features/auth/components/auth/auth-card";

export const Route = createFileRoute("/auth/forgot-password")({
    component: RouteComponent,
});

const RouteComponent = () => (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center p-2 md:p-6">
        <AuthCard view="FORGOT_PASSWORD" />
    </div>
);
