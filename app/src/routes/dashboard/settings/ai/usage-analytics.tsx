import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings/ai/usage-analytics")({
    component: RouteComponent,
});

const RouteComponent = () => <div>Hello "/dashboard/settings/ai/usage-analytics"!</div>;
