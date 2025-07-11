"use client";

import { createFileRoute } from "@tanstack/react-router";

import { AuthCard } from "@/features/auth/components/auth/auth-card";

export const Route = createFileRoute("/auth/accept-invitation/$invitationId/")({
    component: RouteComponent,
});

const RouteComponent = () => <AuthCard view="ACCEPT_INVITATION" />;
