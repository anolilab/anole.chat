import { createFileRoute } from "@tanstack/react-router";

import ModelSettingsCard from "@/features/ai/components/model-settings-card";

const RouteComponent = () => (<ModelSettingsCard />);

export const Route = createFileRoute("/dashboard/settings/ai/models")({
    component: RouteComponent,
});