import { createFileRoute } from "@tanstack/react-router";

import OptionsSettingsCard from "@/features/ai/components/ai-options-settings-card";

const RouteComponent = () => <OptionsSettingsCard />;

export const Route = createFileRoute("/dashboard/settings/ai/options")({
    component: RouteComponent,
});
