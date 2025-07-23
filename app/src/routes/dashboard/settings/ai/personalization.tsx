import { createFileRoute } from "@tanstack/react-router";

import AiCustomizationCard from "@/features/ai/components/settings/ai-customization-card";

const RouteComponent = () => <AiCustomizationCard />;

export const Route = createFileRoute("/dashboard/settings/ai/personalization")({
    component: RouteComponent,
});
