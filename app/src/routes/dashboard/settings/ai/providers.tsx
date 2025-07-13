import { createFileRoute } from "@tanstack/react-router";

import CustomProviderCard from "@/features/ai/components/custom-provider-card";

const RouteComponent = () => <CustomProviderCard />;

export const Route = createFileRoute("/dashboard/settings/ai/providers")({
    component: RouteComponent,
});
