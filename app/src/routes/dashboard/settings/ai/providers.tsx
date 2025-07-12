import { createFileRoute } from "@tanstack/react-router";

import CustomProviderForm from "@/features/ai/components/custom-provider-card";

const RouteComponent = () => (<CustomProviderForm />);

export const Route = createFileRoute("/dashboard/settings/ai/providers")({
    component: RouteComponent,
});
