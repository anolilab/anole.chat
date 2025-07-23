import { createFileRoute } from "@tanstack/react-router";

import UsageAnalyticsCard from "@/features/ai/components/settings/usage-analytics-card";

const RouteComponent = () => <UsageAnalyticsCard />;

export const Route = createFileRoute("/dashboard/settings/ai/usage-analytics")({
    component: RouteComponent,
});
