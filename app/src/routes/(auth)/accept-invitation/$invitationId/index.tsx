"use client";

import { AuthCard } from "@/features/auth/components/auth/auth-card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/accept-invitation/$invitationId/")({
    component: RouteComponent,
});

function RouteComponent() {
    return (<AuthCard view="ACCEPT_INVITATION" />);
}
