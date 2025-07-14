import { createFileRoute } from "@tanstack/react-router";

import AiCustomizationCard from "@/features/ai/components/ai-customization-card";

const RouteComponent = () => <AiCustomizationCard />;

export const Route = createFileRoute("/dashboard/settings/ai/personalization")({
    component: RouteComponent,
});
